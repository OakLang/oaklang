/* eslint-disable max-lines */
import type {
  InstagramUser,
  IntegrationConnection,
  IntegrationSubConnection,
  InternalIntegration,
  RedditUser,
  StackExchangeUser,
  TikTokUser,
  UnsplashUser,
  WakaTimeUser,
  WikipediaUser,
  YCombinatorUser,
  YouTubeChannel,
  YouTubeUser,
} from '~/utils/types';
import { getIntegrationIdFromName } from '~/integrations/utils';
import {
  siBitbucket,
  siGithub,
  siGitlab,
  siInstagram,
  siLinkedin,
  siProducthunt,
  siReddit,
  siStackexchange,
  siTiktok,
  siTwitch,
  siTwitter,
  siUnsplash,
  siWakatime,
  siWikipedia,
  siYcombinator,
  siYoutube,
} from 'simple-icons';

import type { Integration } from '~/server/schema';
import { formatNumber, formatNumberWithSuffix, getSuffixForNumber, roundWithPrecision } from '~/utils';

export const avatarForConnection = (
  connection: IntegrationConnection | undefined,
  providerInfo?: unknown,
  provider?: string | undefined,
): string | undefined => {
  if (connection?.provider) {
    provider = connection.provider;
  }
  if (connection?.providerInfo) {
    providerInfo = connection.providerInfo;
  }
  if (!provider || !providerInfo) {
    return undefined;
  }
  switch (provider) {
    case getIntegrationIdFromName(siGithub.title):
    case getIntegrationIdFromName(siGitlab.title):
      return (providerInfo as { avatar_url: string }).avatar_url.replace('s=80', 's=420');
    case getIntegrationIdFromName(siStackexchange.title): {
      const site = (providerInfo as { profile_image: string; reputation: number }[])
        .sort((a, b) => {
          return a.reputation - b.reputation;
        })
        .toReversed()
        .find((c) => {
          return !!c.profile_image;
        });
      return site?.profile_image;
    }
    case getIntegrationIdFromName(siTwitter.title):
      return (providerInfo as { profile_image_url: string }).profile_image_url.replace('_normal', '');
    case getIntegrationIdFromName(siWakatime.title):
      return (providerInfo as { photo: string }).photo;
    case getIntegrationIdFromName(siLinkedin.title):
      return (providerInfo as { userInfo: { picture: string } }).userInfo.picture;
    case getIntegrationIdFromName(siTwitch.title):
      return (providerInfo as { profile_image_url: string }).profile_image_url;
    case getIntegrationIdFromName(siProducthunt.title):
      return (providerInfo as { user: { profileImage: string } }).user.profileImage;
    case getIntegrationIdFromName(siYoutube.title):
      return (providerInfo as { user: YouTubeUser }).user.picture;
    case getIntegrationIdFromName(siUnsplash.title):
      return (providerInfo as UnsplashUser).profile_image.large;
    case getIntegrationIdFromName(siInstagram.title):
      return (providerInfo as InstagramUser).profile_pic_url;
    case getIntegrationIdFromName(siTiktok.title):
      return (providerInfo as TikTokUser).avatar_large_url;
    case getIntegrationIdFromName(siYcombinator.title):
      return undefined;
    case getIntegrationIdFromName(siWikipedia.title):
      return undefined;
    case getIntegrationIdFromName(siReddit.title):
      return (providerInfo as RedditUser).icon_img;
  }
  return undefined;
};

export const nameForConnection = (
  connection: IntegrationConnection | undefined,
  providerInfo?: unknown,
  provider?: string | undefined,
): string | undefined => {
  if (connection?.provider) {
    provider = connection.provider;
  }
  if (connection?.providerInfo) {
    providerInfo = connection.providerInfo;
  }
  if (!provider || !providerInfo) {
    return undefined;
  }
  switch (provider) {
    case getIntegrationIdFromName(siGithub.title):
    case getIntegrationIdFromName(siGitlab.title):
      return (providerInfo as { name: string }).name;
    case getIntegrationIdFromName(siStackexchange.title): {
      const site = (providerInfo as { display_name: string; reputation: number }[])
        .sort((a, b) => {
          return a.reputation - b.reputation;
        })
        .toReversed()
        .find((c) => {
          return !!c.display_name;
        });
      return site?.display_name;
    }
    case getIntegrationIdFromName(siTwitter.title):
      return (providerInfo as { name: string }).name;
    case getIntegrationIdFromName(siWakatime.title):
      return (providerInfo as { full_name: string }).full_name;
    case getIntegrationIdFromName(siLinkedin.title):
      return (providerInfo as { userInfo: { name: string } }).userInfo.name;
    case getIntegrationIdFromName(siTwitch.title):
      return (providerInfo as { display_name: string }).display_name;
    case getIntegrationIdFromName(siProducthunt.title):
      return (providerInfo as { user: { name: string } }).user.name;
    case getIntegrationIdFromName(siYoutube.title):
      return (providerInfo as { user: YouTubeUser }).user.name;
    case getIntegrationIdFromName(siUnsplash.title):
      return (providerInfo as UnsplashUser).name;
    case getIntegrationIdFromName(siInstagram.title):
      return (providerInfo as InstagramUser).name ?? undefined;
    case getIntegrationIdFromName(siTiktok.title):
      return (providerInfo as TikTokUser).display_name;
    case getIntegrationIdFromName(siYcombinator.title):
      return undefined;
    case getIntegrationIdFromName(siWikipedia.title):
      return undefined;
    case getIntegrationIdFromName(siReddit.title):
      return (providerInfo as RedditUser).name;
  }
  return undefined;
};

export const urlForConnection = (
  connection: Omit<IntegrationConnection, 'avatar' | 'badgeText' | 'url' | 'score'> | undefined,
  providerInfo?: unknown,
  provider?: string | undefined,
): string => {
  if (connection?.provider) {
    provider = connection.provider;
  }
  if (connection?.providerInfo) {
    providerInfo = connection.providerInfo;
  }
  if (!provider) {
    throw Error('Missing provider.');
  }
  if (!providerInfo) {
    throw Error('Missing providerInfo.');
  }
  switch (provider) {
    case getIntegrationIdFromName(siGithub.title):
      return `https://github.com/${connection?.providerAccountUsername}`;
    case getIntegrationIdFromName(siGitlab.title):
      return `https://gitlab.com/${connection?.providerAccountUsername}`;
    case getIntegrationIdFromName(siStackexchange.title): {
      const site = (providerInfo as { link: string; reputation: number }[])
        .sort((a, b) => {
          return a.reputation - b.reputation;
        })
        .toReversed()
        .find((c) => {
          return !!c.link;
        });
      return site?.link ?? '';
    }
    case getIntegrationIdFromName(siTwitter.title):
      return `https://twitter.com/${connection?.providerAccountUsername}`;
    case getIntegrationIdFromName(siWakatime.title):
      return `https://wakatime.com/@${connection?.providerAccountId}`;
    case getIntegrationIdFromName(siBitbucket.title):
      return `https://bitbucket.org/${connection?.providerAccountUsername}`;
    case getIntegrationIdFromName(siLinkedin.title):
      return `https://linkedin.com/in/${connection?.providerAccountUsername}`;
    case getIntegrationIdFromName(siTwitch.title):
      return `https://twitch.tv/${connection?.providerAccountUsername}`;
    case getIntegrationIdFromName(siProducthunt.title):
      return `https://producthunt.com/@${connection?.providerAccountUsername}`;
    case getIntegrationIdFromName(siYoutube.title): {
      const c = (providerInfo as { channels: YouTubeChannel[] }).channels[0];
      if (!c) {
        return `https://www.youtube.com/results?search_query=${(providerInfo as { user: YouTubeUser }).user.name}`;
      }
      return c.snippet.customUrl ? `https://youtube.com/${c.snippet.customUrl}` : `https://www.youtube.com/channel/${c.id}`;
    }
    case getIntegrationIdFromName(siUnsplash.title):
      return `https://unsplash.com/${connection?.providerAccountUsername}`;
    case getIntegrationIdFromName(siInstagram.title):
      return `https://instagram.com/${connection?.providerAccountUsername}`;
    case getIntegrationIdFromName(siTiktok.title):
      return (connection?.providerInfo as TikTokUser).profile_deep_link;
    case getIntegrationIdFromName(siYcombinator.title):
      return `https://news.ycombinator.com/user?id=${connection?.providerAccountUsername}`;
    case getIntegrationIdFromName(siWikipedia.title):
      return `https://en.wikipedia.org/wiki/Special:CentralAuth/${connection?.providerAccountUsername}`;
    case getIntegrationIdFromName(siReddit.title):
      return `https://www.reddit.com/u/${connection?.providerAccountUsername}`;
  }
  throw Error(`Unknown provider: ${provider}`);
};

export const badgeInfoForIntegration = (
  integration: InternalIntegration,
  connections: (typeof Integration.$inferSelect)[],
): { badgeText: string; score: number } => {
  switch (getIntegrationIdFromName(integration.name)) {
    case getIntegrationIdFromName(siGitlab.title):
    case getIntegrationIdFromName(siGithub.title): {
      const f = connections
        .map((c) => {
          return (c.providerInfo as { followers: number }).followers;
        })
        .reduce((x, p) => x + p, 0);
      return badgeInfoForProviderScore(integration.name, f);
    }
    case getIntegrationIdFromName(siStackexchange.title): {
      const r = connections
        .map((c) => {
          return (c.providerInfo as { reputation: number }[]).map((site) => site.reputation).reduce((x, p) => x + p, 0);
        })
        .reduce((x, p) => x + p, 0);
      return badgeInfoForProviderScore(integration.name, r);
    }
    case getIntegrationIdFromName(siTwitter.title): {
      const f = connections
        .map((c) => {
          return (c.providerInfo as { public_metrics: { followers_count: number } }).public_metrics.followers_count;
        })
        .reduce((x, p) => x + p, 0);
      return badgeInfoForProviderScore(integration.name, f);
    }
    case getIntegrationIdFromName(siWakatime.title): {
      const seconds = connections
        .map((c) => {
          return (c.providerInfo as WakaTimeUser).total_seconds;
        })
        .reduce((p, x) => {
          if (x === undefined) {
            return p;
          }
          return x + (p ?? 0);
        }, undefined);
      if (seconds !== undefined) {
        return badgeInfoForProviderScore(integration.name, seconds);
      }
      return { badgeText: siWakatime.title, score: -0.01 };
    }
    case getIntegrationIdFromName(siLinkedin.title): {
      const f = connections
        .map((c) => {
          return (c.providerInfo as { connectionsCount: number }).connectionsCount;
        })
        .reduce((x, p) => x + p, 0);
      return badgeInfoForProviderScore(integration.name, f);
    }
    case getIntegrationIdFromName(siBitbucket.title):
      return badgeInfoForProviderScore(integration.name, -1);
    case getIntegrationIdFromName(siTwitch.title): {
      const f = connections
        .map((c) => {
          return (c.providerInfo as { followers_count?: number }).followers_count ?? 0;
        })
        .reduce((x, p) => x + p, 0);
      return badgeInfoForProviderScore(integration.name, f);
    }
    case getIntegrationIdFromName(siProducthunt.title): {
      const f = connections
        .map((c) => {
          return (c.providerInfo as { followers: number }).followers;
        })
        .reduce((x, p) => x + p, 0);
      return badgeInfoForProviderScore(integration.name, f);
    }
    case getIntegrationIdFromName(siYoutube.title): {
      const s = connections
        .flatMap((c) => {
          return (c.providerInfo as { channels: YouTubeChannel[] }).channels.map((channel) => {
            return parseInt(channel.statistics.subscriberCount);
          });
        })
        .reduce((x, p) => x + p, 0);
      return badgeInfoForProviderScore(integration.name, s);
    }
    case getIntegrationIdFromName(siUnsplash.title): {
      const followers = connections
        .map((c) => {
          return (c.providerInfo as UnsplashUser).followers_count;
        })
        .reduce((p, c) => c + p, 0);
      const downloads = connections
        .map((c) => {
          return (c.providerInfo as UnsplashUser).downloads;
        })
        .reduce((p, c) => c + p, 0);
      const best = followers > downloads ? followers : downloads;
      const suffix = followers > downloads ? 'follower' : 'download';
      return badgeInfoForProviderScore(integration.name, best, suffix);
    }
    case getIntegrationIdFromName(siInstagram.title): {
      const f = connections
        .map((c) => {
          return (c.providerInfo as InstagramUser).edge_followed_by.count;
        })
        .reduce((x, p) => x + p, 0);
      return badgeInfoForProviderScore(integration.name, f);
    }
    case getIntegrationIdFromName(siTiktok.title): {
      const f = connections
        .map((c) => {
          return (c.providerInfo as TikTokUser).follower_count;
        })
        .reduce((x, p) => x + p, 0);
      return badgeInfoForProviderScore(integration.name, f);
    }
    case getIntegrationIdFromName(siYcombinator.title): {
      const karma = connections
        .map((c) => {
          return (c.providerInfo as YCombinatorUser).karma;
        })
        .reduce((x, p) => x + p, 0);
      return badgeInfoForProviderScore(integration.name, karma);
    }
    case getIntegrationIdFromName(siWikipedia.title): {
      const edits = connections
        .map((c) => {
          return (c.providerInfo as WikipediaUser).editcount;
        })
        .reduce((x, p) => x + p, 0);
      return badgeInfoForProviderScore(integration.name, edits);
    }
    case getIntegrationIdFromName(siReddit.title): {
      const f = connections
        .map((c) => {
          return (c.providerInfo as RedditUser).total_karma;
        })
        .reduce((x, p) => x + p, 0);
      return badgeInfoForProviderScore(integration.name, f);
    }
  }
  throw Error(`Unknown provider: ${integration.name}`);
};

export const badgeInfoForConnection = (
  connection: Omit<IntegrationConnection, 'avatar' | 'badgeText' | 'url' | 'score'> | undefined,
  providerInfo?: unknown,
  provider?: string | undefined,
): { badgeText: string; score: number; scoreText: string; suffixText: string } => {
  if (connection?.provider) {
    provider = connection.provider;
  }
  if (connection?.providerInfo) {
    providerInfo = connection.providerInfo;
  }
  if (!provider) {
    throw Error('Missing provider.');
  }
  if (!providerInfo) {
    throw Error('Missing providerInfo.');
  }
  switch (provider) {
    case getIntegrationIdFromName(siGithub.title):
    case getIntegrationIdFromName(siGitlab.title): {
      const f = (providerInfo as { followers: number }).followers;
      return badgeInfoForProviderScore(provider, f);
    }
    case getIntegrationIdFromName(siStackexchange.title): {
      const f = (providerInfo as { reputation: number }[]).map((c) => c.reputation).reduce((p, c) => p + c, 0);
      return badgeInfoForProviderScore(provider, f);
    }
    case getIntegrationIdFromName(siTwitter.title): {
      const f = (providerInfo as { public_metrics: { followers_count: number } }).public_metrics.followers_count;
      return badgeInfoForProviderScore(provider, f);
    }
    case getIntegrationIdFromName(siWakatime.title): {
      const seconds = (providerInfo as WakaTimeUser).total_seconds;
      if (seconds !== undefined) {
        return badgeInfoForProviderScore(provider, seconds);
      }
      return { badgeText: '', score: -0.01, scoreText: '', suffixText: '' };
    }
    case getIntegrationIdFromName(siBitbucket.title):
      return badgeInfoForProviderScore(provider, -2);
    case getIntegrationIdFromName(siLinkedin.title): {
      const f = (providerInfo as { connectionsCount: number }).connectionsCount;
      return badgeInfoForProviderScore(provider, f);
    }
    case getIntegrationIdFromName(siTwitch.title): {
      const f = (providerInfo as { followers_count?: number }).followers_count;
      if (f !== undefined) {
        return badgeInfoForProviderScore(provider, f);
      }
      return { badgeText: '', score: 0, scoreText: '', suffixText: '' };
    }
    case getIntegrationIdFromName(siProducthunt.title): {
      const f = (providerInfo as { followers: number }).followers;
      return badgeInfoForProviderScore(provider, f);
    }
    case getIntegrationIdFromName(siYoutube.title): {
      const s = (providerInfo as { channels: YouTubeChannel[] }).channels
        .map((channel) => {
          return parseInt(channel.statistics.subscriberCount);
        })
        .reduce((x, p) => x + p, 0);
      return badgeInfoForProviderScore(provider, s);
    }
    case getIntegrationIdFromName(siUnsplash.title): {
      const followers = (providerInfo as UnsplashUser).followers_count;
      const downloads = (providerInfo as UnsplashUser).downloads;
      const best = followers > downloads ? followers : downloads;
      const suffix = followers > downloads ? 'follower' : 'download';
      return badgeInfoForProviderScore(provider, best, suffix);
    }
    case getIntegrationIdFromName(siInstagram.title): {
      const f = (providerInfo as InstagramUser).edge_followed_by.count;
      return badgeInfoForProviderScore(provider, f);
    }
    case getIntegrationIdFromName(siTiktok.title): {
      const f = (providerInfo as TikTokUser).follower_count;
      return badgeInfoForProviderScore(provider, f);
    }
    case getIntegrationIdFromName(siYcombinator.title): {
      const f = (providerInfo as YCombinatorUser).karma;
      return badgeInfoForProviderScore(provider, f);
    }
    case getIntegrationIdFromName(siWikipedia.title): {
      const edits = (providerInfo as WikipediaUser).editcount;
      return badgeInfoForProviderScore(provider, edits);
    }
    case getIntegrationIdFromName(siReddit.title): {
      const karma = (providerInfo as RedditUser).total_karma;
      return badgeInfoForProviderScore(provider, karma);
    }
  }
  throw Error(`Unknown provider: ${provider}`);
};

export const subConnectionsForConnection = (
  connection: Omit<IntegrationConnection, 'avatar' | 'badgeText' | 'url' | 'score'> | undefined,
  providerInfo?: unknown,
  provider?: string | undefined,
): IntegrationSubConnection[] => {
  if (connection?.provider) {
    provider = connection.provider;
  }
  if (connection?.providerInfo) {
    providerInfo = connection.providerInfo;
  }
  if (!provider) {
    throw Error('Missing provider.');
  }
  if (!providerInfo) {
    throw Error('Missing providerInfo.');
  }
  switch (provider) {
    case getIntegrationIdFromName(siGithub.title):
    case getIntegrationIdFromName(siGitlab.title):
    case getIntegrationIdFromName(siTwitter.title):
    case getIntegrationIdFromName(siWakatime.title):
    case getIntegrationIdFromName(siBitbucket.title):
    case getIntegrationIdFromName(siLinkedin.title):
    case getIntegrationIdFromName(siProducthunt.title):
    case getIntegrationIdFromName(siTwitch.title):
    case getIntegrationIdFromName(siUnsplash.title):
    case getIntegrationIdFromName(siInstagram.title):
    case getIntegrationIdFromName(siTiktok.title):
    case getIntegrationIdFromName(siYcombinator.title):
    case getIntegrationIdFromName(siWikipedia.title):
    case getIntegrationIdFromName(siReddit.title):
      return [];
    case getIntegrationIdFromName(siStackexchange.title): {
      return (providerInfo as StackExchangeUser[]).map((u) => {
        return {
          href: u.link,
          id: String(u.account_id),
          image: u.site?.icon_url,
          score: u.reputation,
          text: formatNumberWithSuffix(u.reputation, 'reputation', { plural: 'reputation' }),
          title: u.site?.name,
        };
      });
    }
    case getIntegrationIdFromName(siYoutube.title): {
      return (providerInfo as { channels: YouTubeChannel[] }).channels.map((c) => {
        const subscribers = parseInt(c.statistics.subscriberCount);
        return {
          href: c.snippet.customUrl ? `https://youtube.com/${c.snippet.customUrl}` : `https://www.youtube.com/channel/${c.id}`,
          id: c.id,
          image: c.snippet.thumbnails.default.url,
          score: subscribers,
          text: formatNumberWithSuffix(subscribers, 'subscriber'),
          title: c.snippet.customUrl ?? c.snippet.title,
        };
      });
    }
  }
  throw Error(`Unknown provider: ${provider}`);
};

export const badgeInfoForProviderScore = (
  provider: string,
  score: number,
  suffix?: string,
): { badgeText: string; score: number; scoreText: string; suffixText: string } => {
  provider = getIntegrationIdFromName(provider);
  switch (provider) {
    case getIntegrationIdFromName(siGithub.title):
    case getIntegrationIdFromName(siGitlab.title): {
      return {
        badgeText: formatNumberWithSuffix(score, 'follower'),
        score: score,
        scoreText: formatNumber(score),
        suffixText: getSuffixForNumber(score, 'follower'),
      };
    }
    case getIntegrationIdFromName(siStackexchange.title): {
      return {
        badgeText: formatNumberWithSuffix(score, 'total reputation', { plural: 'total reputation' }),
        score: score,
        scoreText: formatNumber(score),
        suffixText: getSuffixForNumber(score, 'total reputation', { plural: 'total reputation' }),
      };
    }
    case getIntegrationIdFromName(siTwitter.title): {
      return {
        badgeText: formatNumberWithSuffix(score, 'follower'),
        score: score,
        scoreText: formatNumber(score),
        suffixText: getSuffixForNumber(score, 'follower'),
      };
    }
    case getIntegrationIdFromName(siWakatime.title): {
      const seconds = score;
      const s = roundWithPrecision(seconds / 3600);
      if (seconds >= 60) {
        if (seconds >= 3600) {
          return {
            badgeText: formatNumberWithSuffix(seconds / 3600, 'hour'),
            score: s,
            scoreText: formatNumber(seconds / 3600),
            suffixText: getSuffixForNumber(seconds / 3600, 'hour'),
          };
        }
        return {
          badgeText: formatNumberWithSuffix(seconds / 60, 'minute', { precision: 0 }),
          score: s,
          scoreText: formatNumber(seconds / 60),
          suffixText: getSuffixForNumber(seconds / 60, 'minute'),
        };
      } else {
        return {
          badgeText: formatNumberWithSuffix(seconds, 'second', { precision: 0 }),
          score: s,
          scoreText: formatNumber(seconds),
          suffixText: getSuffixForNumber(seconds, 'second'),
        };
      }
    }
    case getIntegrationIdFromName(siBitbucket.title):
      return { badgeText: siBitbucket.title, score: -2, scoreText: '', suffixText: '' };
    case getIntegrationIdFromName(siLinkedin.title): {
      return {
        badgeText: formatNumberWithSuffix(score, 'connection'),
        score: score,
        scoreText: formatNumber(score),
        suffixText: getSuffixForNumber(score, 'connection'),
      };
    }
    case getIntegrationIdFromName(siTwitch.title): {
      return {
        badgeText: formatNumberWithSuffix(score, 'follower'),
        score: score,
        scoreText: formatNumber(score),
        suffixText: getSuffixForNumber(score, 'follower'),
      };
    }
    case getIntegrationIdFromName(siProducthunt.title): {
      return {
        badgeText: formatNumberWithSuffix(score, 'follower'),
        score: score,
        scoreText: formatNumber(score),
        suffixText: getSuffixForNumber(score, 'follower'),
      };
    }
    case getIntegrationIdFromName(siYoutube.title): {
      return {
        badgeText: formatNumberWithSuffix(score, 'subscriber'),
        score: score,
        scoreText: formatNumber(score),
        suffixText: getSuffixForNumber(score, 'subscriber'),
      };
    }
    case getIntegrationIdFromName(siUnsplash.title): {
      return {
        badgeText: formatNumberWithSuffix(score, suffix ?? 'download'),
        score: score,
        scoreText: formatNumber(score),
        suffixText: getSuffixForNumber(score, suffix ?? 'download'),
      };
    }
    case getIntegrationIdFromName(siInstagram.title): {
      return {
        badgeText: formatNumberWithSuffix(score, 'follower'),
        score: score,
        scoreText: formatNumber(score),
        suffixText: getSuffixForNumber(score, 'follower'),
      };
    }
    case getIntegrationIdFromName(siTiktok.title): {
      return {
        badgeText: formatNumberWithSuffix(score, 'follower'),
        score: score,
        scoreText: formatNumber(score),
        suffixText: getSuffixForNumber(score, 'follower'),
      };
    }
    case getIntegrationIdFromName(siYcombinator.title): {
      return {
        badgeText: formatNumberWithSuffix(score, 'karma', { plural: 'karma' }),
        score: score,
        scoreText: formatNumber(score),
        suffixText: getSuffixForNumber(score, 'karma', { plural: 'karma' }),
      };
    }
    case getIntegrationIdFromName(siWikipedia.title): {
      return {
        badgeText: formatNumberWithSuffix(score, 'edit'),
        score: score,
        scoreText: formatNumber(score),
        suffixText: getSuffixForNumber(score, 'edit'),
      };
    }
    case getIntegrationIdFromName(siReddit.title): {
      return {
        badgeText: formatNumberWithSuffix(score, 'karma', { plural: 'karma' }),
        score: score,
        scoreText: formatNumber(score),
        suffixText: getSuffixForNumber(score, 'karma', { plural: 'karma' }),
      };
    }
  }
  throw Error(`Unknown provider: ${provider}`);
};
