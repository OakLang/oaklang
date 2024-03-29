/* eslint-disable max-lines */
import type {
  GetUserInfoHandler,
  InstagramUser,
  RedditUser,
  StackExchangeNetworkUser,
  StackExchangeSite,
  StackExchangeUser,
  TikTokUser,
  UnsplashUser,
  WakaTimeUser,
  WikipediaUser,
  YCombinatorUser,
  YouTubeChannel,
  YouTubeUser,
} from '~/utils/types';
import { getIntegrationId, wonderfulFetch } from 'src/integrations/utils';

import { USER_AGENT_CHROME } from '~/utils/constants';
import he from 'he';
import { parse } from 'node-html-parser';
import { parseJSONObject } from '~/utils/validators';
import stackExchangeSites from 'src/integrations/stackexchange-sites.json';
import { truncate } from '~/utils/helpers';

export const WakaTime: GetUserInfoHandler = async (_, token: string, opts) => {
  const resp = await wonderfulFetch('https://api.wakatime.com/api/v1/users/current', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (resp.status !== 200) {
    return { error: `(${resp.status}): ${await resp.text()}` };
  }

  const info = ((await resp.json()) as { data: WakaTimeUser }).data;

  // preserve info.total_seconds because it's populated separately in scrapeIntegrationWakaTime
  if (opts?.connection) {
    info.total_seconds = (opts.connection.providerInfo as WakaTimeUser).total_seconds;
  }

  const username = (info.username ? `@${info.username}` : info.full_name) ?? `${info.id}`;
  return { info: info, uid: info.id, username: username };
};

export const GitHub: GetUserInfoHandler = async (_, token: string) => {
  const resp = await wonderfulFetch('https://api.github.com/user', {
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `token ${token}`,
    },
  });
  if (resp.status !== 200) {
    return { error: `(${resp.status}): ${await resp.text()}` };
  }
  const info = (await resp.json()) as { id: number; login: string };
  return { info: info, uid: String(info.id), username: info.login };
};

export const StackExchange: GetUserInfoHandler = async (_, token: string) => {
  const requestKey = process.env.INTEGRATION_STACK_EXCHANGE_SECRET_REQUEST_KEY;
  if (!requestKey) {
    return { error: 'Missing request key.' };
  }

  const allSites = new Map(
    (stackExchangeSites as StackExchangeSite[]).map<[string, StackExchangeSite]>((site) => {
      return [site.name, site];
    }),
  );

  const networkUsers: StackExchangeNetworkUser[] = [];
  let page = 1;

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition, no-constant-condition
  while (true) {
    const params = new URLSearchParams({
      access_token: token,
      key: requestKey,
      page: String(page),
      pagesize: '100',
      types: 'main_site',
    });
    const url = `https://api.stackexchange.com/2.3/me/associated?${params.toString()}`;
    const associated = await wonderfulFetch(url);
    if (associated.status >= 300) {
      return { error: `Unable to get user associations (${associated.status}): ${await associated.text()}` };
    }

    const { items, has_more } = (await associated.json()) as { has_more: boolean; items: StackExchangeNetworkUser[] };
    items.map((item) => {
      networkUsers.push(item);
    });

    if (items.length === 0 || !has_more) {
      break;
    }

    page++;
  }

  const responses = await Promise.all(
    (
      await Promise.all(
        networkUsers.map(async (networkUser) => {
          const site = allSites.get(networkUser.site_name);
          if (!site) {
            return {};
          }
          const params = new URLSearchParams({
            access_token: token,
            key: requestKey,
            site: site.api_site_parameter,
          });
          const url = `https://api.stackexchange.com/2.3/me?${params.toString()}`;
          return {
            networkUser: networkUser,
            resp: await wonderfulFetch(url),
            site: site,
          };
        }),
      )
    )
      .filter(({ resp }) => {
        return resp?.status == 200;
      })
      .map(async ({ resp, site, networkUser }) => {
        const user = ((await resp?.json()) as { items: StackExchangeUser[] } | null)?.items[0];
        if (!user || !site) {
          return;
        }
        user.site = site;
        user.question_count = networkUser.question_count;
        user.answer_count = networkUser.answer_count;
        return user;
      })
      .filter(async (user) => !!(await user)),
  );

  if (responses.length == 0) {
    return { error: 'No sites.' };
  }

  const user = responses.at(0);
  if (!user) {
    return { error: 'Missing site.' };
  }

  return { info: responses as StackExchangeUser[], uid: String(user.user_id), username: user.display_name };
};

export const GitLab: GetUserInfoHandler = async (_, token: string) => {
  const resp = await wonderfulFetch('https://gitlab.com/api/v4/user', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (resp.status !== 200) {
    return { error: `User response (${resp.status}): ${await resp.text()}` };
  }
  const info = (await resp.json()) as { followers: number; id: number; username: string };

  const followers = await wonderfulFetch(`https://gitlab.com/api/v4/users/${info.id}/followers`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (followers.status !== 200) {
    return { error: `Followers response (${resp.status}): ${await resp.text()}` };
  }

  const count = parseInt(followers.headers.get('X-Total')!);
  info.followers = count;

  return { info: info, uid: String(info.id), username: info.username };
};

export const Twitter: GetUserInfoHandler = async (_, token: string) => {
  const fields = [
    'created_at',
    'description',
    'id',
    'location',
    'name',
    'profile_image_url',
    'protected',
    'public_metrics',
    'username',
    'verified',
    'verified_type',
  ].join(',');
  const resp = await wonderfulFetch(`https://api.twitter.com/2/users/me?user.fields=${fields}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (resp.status !== 200) {
    return { error: `(${resp.status}): ${await resp.text()}` };
  }
  const info = ((await resp.json()) as { data: { id: number; username: string } }).data;
  return { info: info, uid: String(info.id), username: info.username };
};

export const Linkedin: GetUserInfoHandler = async (_, token: string) => {
  const resp = await wonderfulFetch('https://api.linkedin.com/v2/userinfo', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (resp.status !== 200) {
    return { error: `Userinfo response (${resp.status}): ${await resp.text()}` };
  }

  // https://learn.microsoft.com/en-us/linkedin/consumer/integrations/self-serve/sign-in-with-linkedin-v2?context=linkedin%2Fconsumer%2Fcontext#api-request-to-retreive-member-details
  const userInfo = (await resp.json()) as {
    email: string;
    email_verified: boolean;
    locale: string;
    name: string;
    picture: string;
    sub: string;
  };

  const meResp = await wonderfulFetch('https://api.linkedin.com/v2/me', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (meResp.status !== 200) {
    return { error: `Me response (${meResp.status}): ${await meResp.text()}` };
  }

  // https://learn.microsoft.com/en-us/linkedin/shared/integrations/people/profile-api?context=linkedin%2Fconsumer%2Fcontext#sample-response
  const me = (await meResp.json()) as {
    id: string;
    localizedFirstName: string;
    localizedHeadline: string;
    localizedLastName: string;
    picture: string;
    vanityName: string;
  };

  const connectionsResp = await wonderfulFetch(`https://api.linkedin.com/v2/connections/urn:li:person:${me.id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (connectionsResp.status !== 200) {
    return { error: `Connections response (${connectionsResp.status}): ${await connectionsResp.text()}` };
  }

  // https://learn.microsoft.com/en-us/linkedin/shared/integrations/people/profile-api?context=linkedin%2Fconsumer%2Fcontext#sample-response
  const connections = (
    (await connectionsResp.json()) as {
      firstDegreeSize: number;
    }
  ).firstDegreeSize;

  return { info: { connectionsCount: connections, me, userInfo }, uid: me.id, username: me.vanityName };
};

export const Twitch: GetUserInfoHandler = async (integration, token: string) => {
  if (!integration) {
    return { error: 'Missing integration.' };
  }
  const id = getIntegrationId(integration);
  const clientId = process.env[`INTEGRATION_${id.toUpperCase()}_CLIENT_ID`] ?? integration.clientId;

  const resp = await wonderfulFetch('https://api.twitch.tv/helix/users', {
    headers: {
      Authorization: `Bearer ${token}`,
      'Client-Id': clientId,
    },
  });
  if (resp.status !== 200) {
    return { error: `(${resp.status}): ${await resp.text()}` };
  }

  // https://dev.twitch.tv/docs/api/reference/#get-users
  const user = (
    (await resp.json()) as {
      data: {
        broadcaster_type: string;
        created_at: string;
        description: string;
        display_name: string;
        id: string;
        login: string;
        profile_image_url: string;
        type: string;
      }[];
    }
  ).data[0]!;

  // https://dev.twitch.tv/docs/api/reference/#get-broadcaster-subscriptions
  const sResp = await wonderfulFetch(`https://api.twitch.tv/helix/subscriptions?broadcaster_id=${user.id}&first=1`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Client-Id': clientId,
    },
  });
  if (sResp.status !== 200) {
    return { error: `Subscribers response (${resp.status}): ${await resp.text()}` };
  }
  const subscribers_count = ((await sResp.json()) as { total: number }).total;

  // https://dev.twitch.tv/docs/api/reference/#get-channel-followers
  const fResp = await wonderfulFetch(`https://api.twitch.tv/helix/channels/followers?broadcaster_id=${user.id}&first=1`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Client-Id': clientId,
    },
  });
  if (fResp.status !== 200) {
    return { error: `Followers response (${resp.status}): ${await resp.text()}` };
  }
  const followers_count = ((await fResp.json()) as { total: number }).total;

  const info = { followers_count, subscribers_count, ...user };
  return { info, uid: user.id, username: user.login };
};

export const ProductHunt: GetUserInfoHandler = async (integration, token) => {
  const resp = await wonderfulFetch('https://api.producthunt.com/v2/api/graphql', {
    body: JSON.stringify({
      query: 'query { viewer { user { id name username createdAt profileImage twitterUsername } } }',
    }),
    headers: {
      Authorization: `Bearer ${token}`,
    },
    method: 'POST',
  });
  if (resp.status !== 200) {
    return { error: `User response (${resp.status}): ${await resp.text()}` };
  }

  // http://api-v2-docs.producthunt.com.s3-website-us-east-1.amazonaws.com/object/viewer/
  const user = (
    (await resp.json()) as {
      data: {
        viewer: {
          user: {
            createdAt: string;
            id: string;
            name: string;
            profileImage: string;
            twitterUsername?: string;
            username: string;
          };
        };
      };
    }
  ).data.viewer.user;

  const profileResp = await wonderfulFetch(`https://producthunt.com/@${user.username}`, {
    headers: {
      'User-Agent': USER_AGENT_CHROME,
    },
  });
  if (profileResp.status !== 200) {
    return { error: `Profile response (${profileResp.status}): ${await profileResp.text()}` };
  }

  const root = parse(await profileResp.text());
  const followersLink = root.querySelector(`a[href="/@${encodeURIComponent(user.username)}/followers"]`);
  const followers = parseInt(((followersLink?.innerText.match(/([\d,]+) follower/) ?? undefined)?.[1] ?? '-1').replaceAll(',', ''));
  if (followers < 0) {
    return { error: `Profile html response unable to parse followers ${profileResp.status}: ${root.outerHTML}` };
  }

  return { info: { followers, user }, uid: user.id, username: user.username };
};

export const YouTube: GetUserInfoHandler = async (_, token: string) => {
  const userResp = await wonderfulFetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (userResp.status !== 200) {
    return { error: `Userinfo response (${userResp.status}): ${await userResp.text()}` };
  }

  const userData = (await userResp.json()) as YouTubeUser;

  const channelResp = await wonderfulFetch('https://www.googleapis.com/youtube/v3/channels?part=id,snippet,statistics&mine=true', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (channelResp.status !== 200) {
    return { error: `Channels response (${channelResp.status}): ${await channelResp.text()}` };
  }

  const channelData = (await channelResp.json()) as { items: YouTubeChannel[] };

  return {
    info: {
      channels: channelData.items,
      user: userData,
    },
    uid: userData.id,
    username: userData.name,
  };
};

export const Unsplash: GetUserInfoHandler = async (_, token: string) => {
  const resp = await wonderfulFetch('https://api.unsplash.com/me', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (resp.status !== 200) {
    return { error: `(${resp.status}): ${await resp.text()}` };
  }

  const me = (await resp.json()) as UnsplashUser;

  return {
    info: me,
    uid: me.id,
    username: me.username,
  };
};

export const Instagram: GetUserInfoHandler = async (integration, token: string) => {
  const resp = await wonderfulFetch(`https://graph.instagram.com/me?fields=id,username,account_type&access_token=${token}`);
  if (resp.status !== 200) {
    return { error: `Me response (${resp.status}): ${await resp.text()}` };
  }

  // https://developers.facebook.com/docs/instagram-basic-display-api/reference/user#fields
  const respText = await resp.text();
  const me = parseJSONObject(respText) as null | {
    account_type?: string | null;
    id: string;
    name?: string | null;
    username: string;
  };
  if (!me) {
    return { error: `Unable to parse me response: ${respText}` };
  }

  const profileResp = await wonderfulFetch(`https://i.instagram.com/api/v1/users/web_profile_info/?username=${me.username}`, {
    headers: {
      Origin: 'https://www.instagram.com',
      Referer: `https://www.instagram.com/${me.username}`,
      'User-Agent':
        'Mozilla/5.0 (Linux; Android 12; GM1917 Build/SKQ 1.211113.001; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/120.0.6099.43 Mobile Safari/537.36 Instagram 312.1.0.34.111 Android (31/12; 560dpi; 1440x2966; OnePlus; GM1917; OnePlus7Pro; qcom; en_US; 548323749)',
    },
  });
  if (profileResp.status !== 200) {
    return { error: `Profile response (${profileResp.status}): ${await profileResp.text()}` };
  }

  const text = await profileResp.text();
  const data = parseJSONObject(text) as { data: { user: InstagramUser } } | null;
  let user: InstagramUser = {
    edge_follow: {
      count: 0,
    },
    edge_followed_by: {
      count: 0,
    },
    id: me.id,
    is_business_account: false,
    is_private: false,
    is_professional_account: false,
    is_verified: false,
    meId: me.id,
    profile_pic_url: '',
    profile_pic_url_hd: '',
    username: me.username || me.id,
  };
  if (!data) {
    // console.error(`${integration.name} user response invalid JSON ${profileResp.status}: ${truncate(text, 400)}`);
  } else {
    user = data.data.user;
    if (user.username !== me.username) {
      return { error: `${integration?.name} username not matching ${JSON.stringify(me)} ${profileResp.status}: ${truncate(text, 400)}` };
    }
  }

  user.meId = me.id;

  return {
    info: user,
    uid: user.id || me.id,
    username: user.username || me.username || me.id,
  };
};

export const TikTok: GetUserInfoHandler = async (integration, token: string) => {
  const fields = [
    'open_id',
    'union_id',
    'video_count',
    'likes_count',
    'following_count',
    'follower_count',
    'is_verified',
    'profile_deep_link',
    'bio_description',
    'display_name',
    'avatar_large_url',
    'avatar_url_100',
    'avatar_url',
  ].join(',');
  const resp = await wonderfulFetch(`https://open.tiktokapis.com/v2/user/info/?fields=${fields}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (resp.status !== 200) {
    return { error: `(${resp.status}): ${await resp.text()}` };
  }

  const user = ((await resp.json()) as { data: { user?: TikTokUser } }).data.user;
  if (!user) {
    return { error: 'Missing user.' };
  }

  return {
    info: user,
    uid: user.union_id,
    username: user.display_name,
  };
};

export const YCombinator: GetUserInfoHandler = async (_, token, opts) => {
  if (!opts?.manualData?.username) {
    return { error: 'Missing username.' };
  }

  const resp = await wonderfulFetch(`https://hacker-news.firebaseio.com/v0/user/${opts.manualData.username}.json`);
  if (resp.status !== 200) {
    return { error: `(${resp.status}): ${await resp.text()}` };
  }

  // https://github.com/HackerNews/API?tab=readme-ov-file#users
  const info = (await resp.json()) as YCombinatorUser;
  info.about = he.decode(info.about ?? '');

  // make sure YC bio has secret token for this user
  if (!info.about.includes(token)) {
    // retry using real YC profile url because API updates slowly
    const resp = await wonderfulFetch(`https://news.ycombinator.com/user?id=${opts.manualData.username}`);
    if (resp.status !== 200) {
      return { error: `Profile response (${resp.status}): ${await resp.text()}` };
    }

    const text = await resp.text();
    if (!text.includes(token)) {
      return { error: 'Token not in bio.' };
    }
  }

  return {
    info,
    uid: info.id,
    username: info.id,
  };
};

export const Wikipedia: GetUserInfoHandler = async (integration, token: string) => {
  const resp = await wonderfulFetch('https://meta.wikimedia.org/w/rest.php/oauth2/resource/profile', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (resp.status !== 200) {
    return { error: `(${resp.status}): ${await resp.text()}` };
  }

  // https://www.mediawiki.org/wiki/OAuth/For_Developers#Identifying_the_user_2
  const user = (await resp.json()) as WikipediaUser;
  if (!user.username) {
    return { error: 'Missing username.' };
  }

  const htmlResp = await wonderfulFetch(`https://en.wikipedia.org/wiki/Special:CentralAuth/${user.username}`, { isJson: false });
  if (htmlResp.status !== 200) {
    return { error: `central auth response (${htmlResp.status}): ${await htmlResp.text()}` };
  }
  const root = parse(await htmlResp.text());
  const items = root.querySelectorAll('#mw-centralauth-info ul li');
  const editItem = items.find((item) => item.querySelector('strong')?.rawText.trim() == 'Total edit count:')?.rawText;
  if (!editItem?.trim().startsWith('Total edit count:')) {
    return { error: `${integration?.name} central auth response unable to parse total edit count: ${root.innerHTML}` };
  }

  // replace incorrect profile edit count with total edit count across all wikis
  const editCount = parseInt(editItem.replace('Total edit count:', '').trim());
  user.editcount = editCount;

  return {
    info: user,
    uid: String(user.sub),
    username: user.username,
  };
};

export const Reddit: GetUserInfoHandler = async (integration, token) => {
  const resp = await wonderfulFetch('https://oauth.reddit.com/api/v1/me', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (resp.status !== 200) {
    return { error: `(${resp.status}): ${await resp.text()}` };
  }
  const info = (await resp.json()) as RedditUser;
  info.icon_img = info.icon_img.split('?')[0]!;

  return { info: info, uid: info.id, username: info.name };
};
