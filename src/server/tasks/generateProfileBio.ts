import { AUDIT_LOG_USER_PROFILE_BIO_CHANGED, MIN_INTEGRATIONS_FOR_ONBOARDING, NODE_ENV, OPENAI_SECRET_KEY } from '~/utils/constants';
import { AuditLog, Integration, OpenaiResult, User } from 'src/server/schema';
import { acquireLock, releaseLock } from 'src/server/lock';
import { and, desc, eq } from 'drizzle-orm';
import { badgeInfoForConnection, urlForConnection } from '~/integrations/extensions/getters';
import { getReposForConnection, getTagsForConnection, parseBioFromGPT } from '~/integrations/utils/backend';

import { Duration } from 'ts-duration';
import OpenAI from 'openai';
import { db } from '~/server/db';
import { parseFirstName } from '~/utils/helpers';
import { subMinutes } from 'date-fns';
import { wakaq } from '~/server/wakaq';
import { z } from 'zod';

export const generateProfileBio = wakaq.task(
  async (_userId: unknown) => {
    wakaq.logger?.info(`Generate profile bio for User(${_userId as string})`);

    const userIdResult = z.string().safeParse(_userId);
    if (!userIdResult.success) {
      throw new Error(userIdResult.error.message);
    }
    const userId = userIdResult.data;

    const user = await db.query.User.findFirst({
      where: and(eq(User.isActive, true), eq(User.id, userId)),
      with: {
        integrations: true,
      },
    });
    if (!user) {
      throw new Error(`Missing user ${userId}`);
    }

    // generate a fake bio in dev
    if (NODE_ENV === 'development') {
      const response = {
        choices: [
          {
            finish_reason: 'stop' as const,
            index: 0,
            logprobs: null,
            message: {
              content: '{"bio":"fake bio content"}',
              role: 'assistant' as const,
            },
          },
        ],
        created: Date.now(),
        id: 'chatcmpl-fake',
        model: 'gpt-4-1106-preview',
        object: 'chat.completion' as const,
      };
      const results = await db
        .insert(OpenaiResult)
        .values({
          genType: 'bio',
          response: response,
          systemPrompt: 'system prompt mocked in dev',
          userId: user.id,
          userPrompt: 'user prompt mocked in dev',
        })
        .returning();

      const bio = parseBioFromGPT(response);
      if (!bio) {
        wakaq.logger?.error(`Missing fake bio: ${response.choices[0]?.message.content}`);
        return;
      }

      await db.update(User).set({ bio: bio }).where(eq(User.id, user.id));

      const lastEvent = await db.query.AuditLog.findFirst({ orderBy: [desc(AuditLog.createdAt)], where: eq(AuditLog.userId, user.id) });
      const bioId = results[0]?.id;
      if (bioId && lastEvent) {
        await db.insert(AuditLog).values({
          event: AUDIT_LOG_USER_PROFILE_BIO_CHANGED,
          ip: lastEvent.ip,
          metadata: { bioId },
          userAgent: lastEvent.userAgent,
          userId: user.id,
        });
      }
      return;
    }

    // exclusive lock
    const lockKey = `gen-bio-${user.id}`;
    const lockId = await acquireLock(lockKey, Duration.minute(10));
    if (!lockId) {
      wakaq.logger?.info(`Unable to acquire exclusive lock for User(${user.id})`);
      return;
    }

    if (user.integrations.length < MIN_INTEGRATIONS_FOR_ONBOARDING) {
      wakaq.logger?.info('Skip generate bio because user has less than 3 integrations');
      await releaseLock(lockKey, lockId);
      return;
    }

    const name = user.githubUser.name ?? user.username ?? user.githubUser.login;
    const firstName = parseFirstName(name);
    if (!firstName) {
      wakaq.logger?.info(`Skip generate bio because unable to parse first name: ${name}`);
      await releaseLock(lockKey, lockId);
      return;
    }

    const fiveMinsAgo = subMinutes(new Date(), 5);

    const recentBio = await db.query.OpenaiResult.findFirst({
      orderBy: [desc(OpenaiResult.createdAt)],
      where: and(eq(OpenaiResult.userId, userId), eq(OpenaiResult.genType, 'bio')),
    });
    if (recentBio) {
      if (recentBio.createdAt > fiveMinsAgo) {
        wakaq.logger?.info('Skip generate bio because already generated recently within last 5 minutes');
        await releaseLock(lockKey, lockId);
        return;
      }
    }

    const openai = new OpenAI({
      apiKey: OPENAI_SECRET_KEY,
    });

    const systemPrompt = [
      'You’re an assistant that generates JSON.',
      'You always return just the JSON with no additional description or context.',
      'Your task is to generate a matching public bio string for a user.',
      'Your input will be a JSON Object with information about the user.',
      'The JSON Object has keys "name" and "profiles".',
      'The "name" key is the user’s first name or username.',
      'The "profiles" key is a JSON array of Objects, containing keys "profile_url", "text", "score", "maxScore", "tags", "repos".',
      'The "text" key is the key metric for a profile, such as "1M followers", "43.6K subscribers", or "300 downloads".',
      'The "score" key is the number which was used in the "text" key, such as 1000000, 43600, or 300.',
      'The "maxScore" key is the highest score among all users for this profile type, to help normalize the score.',
      'The "tags" key is an array of Objects associated with the user like',
      '{"score": 20, "text": "20 upvotes", "type": "stackoverflow question", "name": "AWS"}',
      'or {"score": 10000, "text": "10,000 hrs 37 mins", "type": "coding", "name": "TypeScript"}.',
      'The "repos" key is an array of source code repositories the user has contributed to with keys "repo_url", "stars_count", "forks_count", "repo_languages".',
      'The "repo_languages" key is an Object of program languages as keys with number of lines for that language as values.',
      'Write your output in json with a single key called "bio".',
      'Do not list any urls in your output.',
      'Write long numbers as 2K instead of 2,000 or 1M instead of 1,003,051.',
      'Start with the most impressive profile "score" and don’t say much about their profiles with low scores.',
      'Compare "score" to "maxScore" to judge the weight/impressiveness of their profiles, but don’t actually mention the max score.',
      'If scores are similar, GitHub and WakaTime profiles are the most impressive so start with those.',
      'If they have a GitHub repo with a lot of stars make sure to mention it, since open source contributions are very impressive.',
      'Start the bio with the user’s name, and mention their focus(backend, front-end, full-stack, mobile, devops, data science) if',
      'it can be determined using "repo_languages" or "tags".',
      `For ex: "${firstName} is a…".`,
    ].join(' ');
    const userPrompt = JSON.stringify({
      name: firstName,
      profiles: await Promise.all(
        user.integrations.map(async (i) => {
          const info = badgeInfoForConnection(i);
          return {
            maxScore:
              (
                await db.query.Integration.findFirst({
                  orderBy: [desc(Integration.providerAccountScore)],
                  where: eq(Integration.provider, i.provider),
                })
              )?.providerAccountScore ?? 0,
            profile_url: urlForConnection(i),
            repos: await getReposForConnection(i),
            score: Math.floor(info.score),
            tags: await getTagsForConnection(i),
            text: info.badgeText,
          };
        }),
      ),
    });

    const response = await openai.chat.completions.create({
      frequency_penalty: 0.6,
      max_tokens: 400,
      messages: [
        {
          content: systemPrompt,
          role: 'system',
        },
        {
          content: userPrompt,
          role: 'user',
        },
      ],
      model: 'gpt-4-0125-preview',
      temperature: 0.65,
      top_p: 1,
    });

    const results = await db
      .insert(OpenaiResult)
      .values({
        genType: 'bio',
        response: response,
        systemPrompt: systemPrompt,
        userId: user.id,
        userPrompt: userPrompt,
      })
      .returning();

    const bio = parseBioFromGPT(response);
    if (!bio) {
      wakaq.logger?.error(`Missing bio from ChatGPT response: ${response.choices[0]?.message.content}`);
      await releaseLock(lockKey, lockId);
      return;
    }
    if (bio.includes('…')) {
      wakaq.logger?.error(`ChatGPT response included example text: ${response.choices[0]?.message.content}`);
      await releaseLock(lockKey, lockId);
      return;
    }

    await db.update(User).set({ bio: bio }).where(eq(User.id, user.id));

    const lastEvent = await db.query.AuditLog.findFirst({ orderBy: [desc(AuditLog.createdAt)], where: eq(AuditLog.userId, user.id) });
    const bioId = results[0]?.id;
    if (bioId && lastEvent) {
      await db.insert(AuditLog).values({
        event: AUDIT_LOG_USER_PROFILE_BIO_CHANGED,
        ip: lastEvent.ip,
        metadata: { bioId },
        userAgent: lastEvent.userAgent,
        userId: user.id,
      });
    }

    await releaseLock(lockKey, lockId);
  },
  { name: 'generateProfileBio' },
);
