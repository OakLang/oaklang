import type { Integration, List } from '~/server/schema';
import type { NextPage } from 'next';
import type { ReactElement, ReactNode } from 'react';
import type { RefetchOptions, RefetchQueryFilters } from '@tanstack/react-query';

import type { AppProps } from 'next/app';
import type { NextRequest } from 'next/server';

export type NextPageWithLayout<P = object, IP = P> = NextPage<P, IP> & {
  getLayout?: (page: ReactElement, pageProps: P) => ReactNode;
};

export type AppPropsWithLayout<P = unknown> = AppProps<P> & {
  Component: NextPageWithLayout;
};

export type FeedItem = {
  createdAt: Date;
  description: TimelineTemplate[] | null;
  eventType: string;
  id: string;
  integrationId: string;
  postedAt: Date;
  programLanguageColor?: string | null;
  programLanguageName: string | null;
  provider: string;
  score?: number | null;
  subtitle: TimelineTemplate[];
  title: TimelineTemplate[];
  user: PublicUser;
  viewedAt?: Date | null;
};

export type PublicUser = {
  avatarUrl: string;
  bio: string | null;
  createdAt: Date;
  followersCount: number;
  followingCount: number;
  githubId: number;
  githubProfileUrl: string;
  githubUsername: string;
  id: string;
  integrations: EditProfileIntegration[];
  isAdmin?: boolean;
  name: string | null;
  url: string;
  username: string | null;
};

export type PublicList = typeof List.$inferSelect & { followersCount: number; membersCount: number; user: PublicUser };

export type EditProfileIntegration = {
  badgeText: string;
  connections: IntegrationConnection[];
  icon: string;
  name: string;
  profileDefaults?: ProfileDefault[];
  score: number;
};

export type ProfileDefault = {
  defaultType: string;
  integrationId: string;
};

export interface AuthContextType {
  currentUser?: PublicUser;
  isAuthenticated: boolean | undefined;
  isFetching: boolean;
  isLoading: boolean;
  refetch?: <TPageData>(options?: (RefetchOptions & RefetchQueryFilters<TPageData>) | undefined) => unknown;
  signOut: () => Promise<void>;
}

export type GitHubBaseUser = {
  avatar_url: string;
  id: number;
  login: string;
  url: string;
};

export type GitHubUser = GitHubBaseUser & {
  bio?: string | null;
  blog?: string | null;
  company?: string | null;
  created_at: string;
  email?: string | null;
  events_url?: string;
  followers: number;
  followers_url?: string;
  following: number;
  following_url?: string;
  gists_url?: string;
  hireable?: boolean | null;
  html_url?: string;
  location?: string | null;
  name?: string | null;
  node_id: string;
  organizations_url?: string;
  public_gists?: number;
  public_repos?: number;
  received_events_url?: string;
  repos_url?: string;
  site_admin: boolean;
  starred_url?: string;
  subscriptions_url?: string;
  twitter_username?: string | null;
  updated_at?: string | null;
};

export type GitHubGraphQLUser = {
  avatarUrl: string;
  bio?: string | null;
  company?: string | null;
  createdAt: string;
  databaseId: number;
  email: string;
  followers: {
    totalCount: number;
  };
  following: {
    totalCount: number;
  };
  id: string;
  isBountyHunter: boolean;
  isCampusExpert: boolean;
  isDeveloperProgramMember: boolean;
  isEmployee: boolean;
  isGitHubStar: boolean;
  isHireable: boolean;
  isSiteAdmin: boolean;
  location?: string | null;
  login: string;
  name?: string | null;
  pronouns?: string | null;
  twitterUsername?: string | null;
  updatedAt: string;
  url: string;
  websiteUrl?: string | null;
};

export type OAuthResponse = {
  access_token: string;
  expires_at?: string | null;
  expires_in?: string | number;
  refresh_token?: string | null;
  uid?: string | null;
  user_id?: string | null;
};

export type OAuthToken = {
  access_token: string;
  expires_at?: Date;
  refresh_token?: string;
  uid?: string;
};

export type OAuthLoginState = {
  c: string;
  follow?: string;
  n?: string;
};

export enum IntegrationDataType {
  answers = 'answers', // SO answers, GH PRs, etc.
  commits = 'commits',
  followers = 'followers', // profile followers, repo watchers (not stars)
  forks = 'forks',
  languages = 'languages',
  likes = 'likes', // GH stars, SO votes, etc.
  lines = 'lines',
  points = 'points', // SO reputation, karma, etc.
  questions = 'questions', // SO questions, GH issues, etc.
  repos = 'repos',
  seconds = 'seconds',
  shares = 'shares',
  views = 'views',
}

export type IntegrationData = {
  display?: string;
  type: IntegrationDataType;
};

export type IntegrationScopes = {
  default: string;
};

export type InternalIntegration = {
  accessTokenHandler?: AccessTokenHandler;
  authorizeUrl: string;
  authorizeUrlBuilder?: AuthorizeUrlBuilder;
  clientId: string;
  data?: IntegrationData[];
  description: string;
  extraAppInfo?: unknown;
  icon?: string;
  isAwaitingVerification?: boolean;
  isHidden?: boolean;
  isManualValidation?: boolean;
  name: string;
  needsScrapeForUserInfo?: boolean;
  postInstallUrl?: string;
  refreshTokenHandler?: RefreshTokenHandler;
  revokeHandler?: RevokeTokenHandler;
  revokeUrl?: string;
  scopes?: IntegrationScopes;
  tokenUrl: string;
  userInfoHandler: GetUserInfoHandler;
};

export type IntegrationWithConnections = InternalIntegration & {
  connections: IntegrationConnection[];
  isConnected: boolean;
  oauthUrl?: string;
};

export type IntegrationConnection = {
  avatar?: string;
  badgeText: string;
  id?: string;
  provider: string;
  providerAccountId?: string;
  providerAccountUsername: string;
  providerInfo?: unknown;
  score?: number;
  subConnections?: IntegrationSubConnection[];
  url: string;
};

export type IntegrationSubConnection = {
  href: string;
  id: string;
  image?: string;
  score: number;
  text: string;
  title?: string;
};

type GetUserInfoHandlerResult =
  | {
      error: string;
    }
  | {
      error?: undefined;
      info: unknown;
      uid: string;
      username: string;
    };

export type GetUserInfoHandler = (
  integration: InternalIntegration | null,
  token: string,
  opts?: { connection?: typeof Integration.$inferSelect; manualData?: { username: string } },
) => Promise<GetUserInfoHandlerResult>;

export type AuthorizeUrlBuilder = (
  integration: InternalIntegration,
  req: NextRequest,
  scope: string | undefined,
  authorize_url: string,
  client_id: string,
  state: string,
) => string;

export type AccessTokenHandler = (
  integration: InternalIntegration,
  req: NextRequest,
  secret: string,
  code: string,
  clientId: string,
) => Promise<Response>;

export type RefreshTokenHandler = (
  integration: InternalIntegration,
  secret: string,
  clientId: string,
  refreshToken: string,
) => Promise<Response>;

export type RevokeTokenHandler = (integration: typeof Integration.$inferSelect, token: string) => Promise<boolean>;

export enum StackExchangeSiteState {
  linked_meta = 'linked_meta',
  normal = 'normal',
  open_beta = 'open_beta',
}

export enum StackExchangeSiteType {
  main = 'main_site',
  meta = 'meta_site',
}

export type StackExchangeSite = {
  aliases?: string[];
  api_site_parameter: string;
  audience?: string;
  favicon_url: string;
  high_resolution_icon_url: string;
  icon_url: string;
  launch_date?: number;
  logo_url: string;
  name: string;
  site_state: StackExchangeSiteState;
  site_type: StackExchangeSiteType;
  site_url: string;
};

export type StackExchangeNetworkUser = {
  account_id: number;
  answer_count: number;
  badge_counts: StackExchangeUserBadgeCount;
  creation_date: number;
  last_access_date: number;
  question_count: number;
  reputation: number;
  site_name: string;
  site_url: string;
  user_id: number;
  user_type: string;
};

export type StackExchangeUserBadgeCount = {
  bronze: number;
  gold: number;
  silver: number;
};

export type StackExchangeUser = {
  about_me: string;
  account_id: number;
  answer_count?: number;
  badge_counts: StackExchangeUserBadgeCount;
  creation_date: number;
  display_name: string;
  down_vote_count?: number;
  is_employee: boolean;
  last_access_date: number;
  last_modified_date: number;
  link: string;
  location?: string;
  profile_image: string;
  question_count?: number;
  reputation: number;
  reputation_change_day: number;
  reputation_change_month: number;
  reputation_change_quarter: number;
  reputation_change_week: number;
  reputation_change_year: number;
  site?: StackExchangeSite;
  up_vote_count?: number;
  user_id: number;
  user_type: string;
  view_count?: number;
  website_url: '';
};

export enum StackExchangeNetworkActivityType {
  answerPosted = 'answer_posted',
  badgeEarned = 'badge_earned',
  commentPosted = 'comment_posted',
  questionPosted = 'question_posted',
}

export type StackExchangeNetworkActivity = {
  account_id: number;
  activity_type: StackExchangeNetworkActivityType;
  api_site_parameter: string;
  badge_id?: number;
  creation_date: number;
  description: string;
  link: string;
  post_id?: number;
  score?: number;
  tags?: string[];
  title: string;
};

export type StackExchangeQuestion = {
  accepted_answer_id?: number | null;
  answer_count: number;
  api_site_parameter: string;
  closed_date?: number;
  closed_reason?: string;
  comment_count: number;
  community_owned_date?: number;
  creation_date: number;
  delete_vote_count: number;
  down_vote_count: number;
  favorite_count: number;
  is_answered?: boolean;
  last_activity_date?: number;
  last_edit_date?: number;
  link: string;
  locked_date?: number;
  protected_date?: number;
  question_id: number;
  score: number;
  tags: string[];
  title: string;
  up_vote_count: number;
  view_count: number;
};

export type StackExchangeAnswer = {
  answer_id: number;
  api_site_parameter: string;
  comment_count: number;
  community_owned_date?: number;
  creation_date: number;
  down_vote_count: number;
  is_accepted: boolean;
  last_activity_date: number;
  last_edit_date?: number;
  link: string;
  locked_date?: number;
  question_id: number;
  score: number;
  tags: string[];
  title: string;
  up_vote_count: number;
};

export type StackExchangeCommentRaw = {
  comment_id: number;
  creation_date: number;
  edited: boolean;
  link: string;
  post_id: number;
  post_type: StackExchangePostType;
  score: number;
};

export type StackExchangeComment = {
  answer_id?: number;
  api_site_parameter: string;
  comment_id: number;
  creation_date: number;
  edited: boolean;
  link: string;
  post_type: StackExchangePostType;
  question_id: number;
  score: number;
  tags: string[];
};

export enum StackExchangePostType {
  answer = 'answer',
  article = 'article',
  question = 'question',
}

export type RedditUser = {
  awardee_karma: number;
  awarder_karma: number;
  can_create_subreddit: boolean;
  can_edit_name: boolean;
  coins: number;
  comment_karma: number;
  created: number;
  created_utc: number;
  gold_creddits: number;
  has_android_subscription: boolean;
  has_gold_subscription: boolean;
  has_ios_subscription: boolean;
  has_paypal_subscription: boolean;
  has_stripe_subscription: boolean;
  has_subscribed: boolean;
  has_subscribed_to_premium: boolean;
  has_verified_email: boolean;
  icon_img: string;
  id: string;
  in_beta: boolean;
  inbox_count: number;
  is_gold: boolean;
  is_mod: boolean;
  is_sponsor: boolean;
  is_suspended: boolean;
  link_karma: number;
  name: string;
  num_friends: number;
  over_18: boolean;
  pref_nightmode: boolean;
  pref_show_twitter: boolean;
  total_karma: number;
  verified: boolean;
};

export enum SpecializationType {
  api = 'api',
  backend = 'backend',
  database = 'database',
  desktop = 'desktop',
  embedded = 'embedded',
  frontend = 'frontend',
  fullstack = 'fullstack',
  mobile = 'mobile',
  vr = 'vr',
}

export enum PlatformType {
  android = 'android',
  ios = 'ios',
  linux = 'linux',
  mac = 'mac',
  smart_tv = 'smart_tv',
  vr = 'vr',
  web = 'web',
  windows = 'windows',
}

// https://developers.google.com/youtube/v3/docs/channels#resource-representation
export type YouTubeChannel = {
  auditDetails: {
    communityGuidelinesGoodStanding: boolean;
    contentIdClaimsGoodStanding: boolean;
    copyrightStrikesGoodStanding: boolean;
    overallGoodStanding: boolean;
  };
  brandingSettings: {
    channel: {
      country: string;
      defaultLanguage: string;
      description: string;
      keywords: string;
      title: string;
    };
  };
  id: string;
  snippet: {
    country: string;
    customUrl?: string;
    defaultLanguage: string;
    description: string;
    publishedAt: string;
    thumbnails: { default: { url: string } };
    title: string;
  };
  statistics: {
    hiddenSubscriberCount: boolean; // whether the subscriber count is hidden or public
    subscriberCount: string;
    videoCount: number; // number of public videos uploaded to the channel
    viewCount: number; // number of times the channel has been viewed, not number of times videos have been watched
  };
  topicDetails: {
    topicCategories: string[]; // A list of Wikipedia URLs that describe the channel's content.
  };
};

export type YouTubeUser = {
  email: string;
  family_name?: string;
  given_name?: string;
  id: string;
  locale: string;
  name: string;
  picture: string;
  verified_email: boolean;
};

export type YouTubeThumbnail = {
  height: number;
  url: string;
  width: number;
};

export type YouTubeVideoSnippet = {
  categoryId: string;
  channelId: string;
  channelTitle: string;
  description: string;
  publishedAt: string;
  tags: string[];
  thumbnails: {
    default: YouTubeThumbnail;
    high: YouTubeThumbnail;
    maxres: YouTubeThumbnail;
    medium: YouTubeThumbnail;
    standard: YouTubeThumbnail;
  }[];
  title: string;
};

export type YouTubeVideoStatistics = {
  commentCount: string;
  dislikeCount: string;
  favoriteCount: string;
  likeCount: string;
  viewCount: string;
};

export type YoutubeVideo = {
  etag: string;
  id: string;
  kind: string;
  snippet: YouTubeVideoSnippet;
  statistics: YouTubeVideoStatistics;
};

export type ProductHuntUser = {
  followers: number;
  user: {
    createdAt: string;
    id: string;
    name: string;
    profileImage: string | null;
    twitterUsername: string | null;
    username: string;
  };
};

export type ProductHuntPost = {
  createdAt: string;
  description: string;
  id: string;
  makers: {
    id: string;
  }[];
  name: string;
  slug: string;
  url: string;
  userId: string;
  votesCount: number;
  website: string;
};

// https://unsplash.com/documentation#current-user
export type UnsplashUser = {
  bio?: string | null;
  confirmed: boolean;
  downloads: number;
  first_name: string;
  followers_count: number;
  following_count: number;
  for_hire: boolean;
  id: string;
  instagram_username?: string | null;
  last_name: string;
  location?: string | null;
  name: string;
  portfolio_url?: string | null;
  profile_image: {
    large: string;
  };
  social: {
    instagram_username: string | null;
    paypal_email: string | null;
    twitter_username: string | null;
  };
  total_collections: number;
  total_likes: number;
  total_photos: number;
  total_promoted_photos: number;
  twitter_username?: string | null;
  username: string;
};

// https://stackoverflow.com/a/73376216/1290627
export type InstagramUser = {
  account_type?: string | null;
  biography?: boolean | null;
  business_category_name?: string | null;
  business_email?: string | null;
  business_phone_number?: string | null;
  category_name?: string | null;
  country_block?: boolean;
  edge_follow: { count: number };
  edge_followed_by: { count: number };
  external_url?: string | null;
  fbid?: string | null;
  full_name?: string | null;
  guardian_id?: string | null;
  has_ar_effects?: boolean;
  has_channel?: boolean;
  has_clips?: boolean;
  has_guides?: boolean;
  hide_like_and_view_counts?: boolean;
  highlight_reel_count?: number;
  id: string;
  is_business_account: boolean;
  is_joined_recently?: boolean;
  is_private: boolean;
  is_professional_account: boolean;
  is_regulated_c18?: boolean | null;
  is_supervised_user?: boolean;
  is_verified: boolean;
  is_verified_by_mv4b?: boolean | null;
  meId: string;
  name?: string | null;
  overall_category_name?: string | null;
  pinned_channels_list_count?: number | null;
  profile_pic_url: string;
  profile_pic_url_hd: string;
  username: string;
};

// https://developers.tiktok.com/doc/tiktok-api-v2-get-user-info/
export type TikTokUser = {
  avatar_large_url: string;
  avatar_url: string;
  avatar_url_100: string;
  bio_description: string;
  display_name: string;
  follower_count: number;
  following_count: number;
  is_verified: boolean;
  likes_count: number;
  open_id: string;
  profile_deep_link: string;
  union_id: string;
  video_count: number;
};

export type WakaTimeUser = {
  email?: string | null;
  full_name: string | null;
  id: string;
  total_seconds?: number;
  username: string | null;
};

// https://wakatime.com/developers/#stats
export type WakaTimeStats = {
  categories: {
    name: string;
    percent: number;
    text: string;
    total_seconds: number;
  }[];
  daily_average: number;
  daily_average_including_other_language: number;
  dependencies: {
    name: string;
    percent: number;
    text: string;
    total_seconds: number;
  }[];
  editors: {
    name: string;
    percent: number;
    text: string;
    total_seconds: number;
  }[];
  human_readable_total: string;
  human_readable_total_including_other_language: string;
  languages: {
    name: string;
    percent: number;
    text: string;
    total_seconds: number;
  }[];
  operating_systems: {
    name: string;
    percent: number;
    text: string;
    total_seconds: number;
  }[];
  total_seconds?: number;
  total_seconds_including_other_language?: number;
};

// We only store partial repo info in IntegrationScrape type 'repos' as an index to the full repo
export type GitHubRepoScrape = {
  full_name: string;
  id: number;
};

// https://docs.github.com/en/rest/repos/repos?apiVersion=2022-11-28#list-repositories-for-a-user
export type GitHubRepo = {
  archived: boolean;
  contributors?: GitHubRepoContributor[];
  created_at: string;
  default_branch: string | null;
  description: string;
  disabled: boolean;
  fork: boolean;
  forks?: unknown[];
  forks_count: number;
  full_name: string;
  homepage?: string | null;
  html_url: string;
  id: number;
  language?: string | null;
  languages?: Record<string, number>;
  name: string;
  open_issues_count: number;
  owner: GitHubUser;
  private: boolean;
  size: number;
  stargazers?: GitHubUser[];
  stargazers_count: number;
  subscribers?: GitHubUser[];
  topics: string[];
  updated_at: string | null;
  url: string;
  visibility: string;
  watchers_count: number;
};

export type GitHubRepoContributor = GitHubUser & {
  contributions: number;
};

export type GitHubEvent = {
  actor: GitHubBaseUser;
  created_at: string;
  id: string;
  org?: GitHubBaseUser;
  payload: {
    action?: string;
  };
  public: boolean;
  repo?: {
    id: number;
    name: string;
    url: string;
  };
  type: GitHubEventType;
};

export enum GitHubEventType {
  CreateEvent = 'CreateEvent',
  DeleteEvent = 'DeleteEvent',
  ForkEvent = 'ForkEvent',
  GollumEvent = 'GollumEvent',
  IssueCommentEvent = 'IssueCommentEvent',
  IssuesEvent = 'IssuesEvent',
  MemberEvent = 'MemberEvent',
  PublicEvent = 'PublicEvent',
  PullRequestEvent = 'PullRequestEvent',
  PullRequestReviewCommentEvent = 'PullRequestReviewCommentEvent',
  PullRequestReviewEvent = 'PullRequestReviewEvent',
  PullRequestReviewThreadEvent = 'PullRequestReviewThreadEvent',
  PushEvent = 'PushEvent',
  ReleaseEvent = 'ReleaseEvent',
  SponsorshipEvent = 'SponsorshipEvent',
  WatchEvent = 'WatchEvent',
}

export type GitLabProject = {
  created_at: string;
  default_branch: string | null;
  description: string | null;
  forked_from_project?: {
    forks_count: number;
    id: number;
    path_with_namespace: string;
    star_count: number;
  };
  forks_count: number;
  id: number;
  owner?: {
    avatar_url: string;
    id: number;
    locked?: boolean;
    name?: string;
    state?: string;
    username: string;
    web_url: string;
  };
  path_with_namespace: string;
  star_count: number;
  topics: string[];
  updated_at: string | null;
  visibility: string;
  web_url: string;
};

export type YCombinatorUser = {
  about: string | null;
  created: number;
  id: string;
  karma: number;
  submitted: number[];
};

export type WikipediaUser = {
  blocked: boolean;
  confirmed_email: boolean;
  editcount: number;
  email_verified: boolean;
  grants: string[];
  groups: string[];
  registered: string;
  rights: string[];
  sub: number;
  username: string;
};

export enum TimelineEventType {
  interaction = 'interaction',
  milestone = 'milestone',
}

export enum TimelineTemplateType {
  avatar = 'avatar',
  icon_svg = 'icon_svg',
  link = 'link',
  text = 'text',
}

export type TimelineTemplateLink = {
  children: string | TimelineTemplate[];
  href: string;
  type: TimelineTemplateType.link;
};

export type TimelineTemplateText = {
  text: string;
  type: TimelineTemplateType.text;
};

export type TimelineTemplateIconSvg = {
  icon: string;
  type: TimelineTemplateType.icon_svg;
};

export type TimelineTemplateAvatar = {
  avatarUrl: string;
  type: TimelineTemplateType.avatar;
};

export type TimelineTemplate = TimelineTemplateText | TimelineTemplateLink | TimelineTemplateIconSvg | TimelineTemplateAvatar;

export type BadgeExplanation = {
  provider: string;
  score: number;
  text: string;
};

export type PublicConnection = {
  avatar?: string;
  badgeText: string;
  createdAt: Date;
  id: string;
  name?: string;
  provider: string;
  providerAccountId: string;
  providerAccountUsername: string;
  url: string;
};

export type SidebarItem = {
  activeIcon?: ReactNode;
  children?: Omit<SidebarItem, 'children' | 'icon' | 'activeIcon'>[];
  exact?: boolean;
  excludePaths?: { exact?: boolean; href: string }[];
  extraMatches?: { exact?: boolean; href: string }[];
  href: string;
  icon: ReactNode;
  label: string;
};
