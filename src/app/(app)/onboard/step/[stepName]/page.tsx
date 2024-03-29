import { APP_NAME } from '~/utils/constants';
import OnboardStepper from './_components/onboard-stepper';
import type { Metadata } from 'next';

type Props = {
  params: {
    stepName: string;
  };
};

const titles: Record<string, string> = {
  'claim-your-username': `Claim your Username - ${APP_NAME}`,
  'connect-some-accounts': `Connect some accounts - ${APP_NAME}`,
  'preview-your-profile': `Preview your Profile - ${APP_NAME}`,
};

export const generateMetadata = ({ params }: Props) => {
  return {
    title: titles[params.stepName],
  } satisfies Metadata;
};

export default function StepPage() {
  return <OnboardStepper />;
}
