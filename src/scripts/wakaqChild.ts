import 'dotenv/config';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import * as afterFollowingUser from '~/server/tasks/afterFollowingUser';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import * as generateProfileBio from '~/server/tasks/generateProfileBio';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import * as populateSuggestFollowUsersTable from '~/server/tasks/infra/populateSuggestFollowUsersTable';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import * as syncBadgesForAllUsers from '~/server/tasks/badge/syncBadgesForAllUsers';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import * as syncIntegration from '~/server/tasks/scrape/scrapeIntegration';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import * as syncIntegrationMilestonesForAllUsers from '~/server/tasks/milestones/syncIntegrationMilestonesForAllUsers';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import * as syncIntegrationTimelineForAllUsers from '~/server/tasks/timeline/syncIntegrationTimelineForAllUsers';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import * as syncUserInfo from '~/server/tasks/scrape/syncUserInfo';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import * as syncUserInfoForAllUsers from '~/server/tasks/scrape/syncUserInfoForAllUsers';

import { WakaQChildWorker } from 'wakaq';
import { wakaq } from '~/server/wakaq';

await new WakaQChildWorker(wakaq).start();
wakaq.disconnect();
process.exit(0);
