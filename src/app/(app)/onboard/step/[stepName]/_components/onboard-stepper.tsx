'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useMemo, useCallback, useEffect } from 'react';
import { LuCheck } from 'react-icons/lu';
import { useAuth } from '~/providers/AuthProvider';
import ClaimUsernameStep from '~/components/onboarding/ClaimUsernameStep';
import ConnectAccountsStep from '~/components/onboarding/ConnectAccountsStep';
import PreviewProfileStep from '~/components/onboarding/PreviewProfileStep';
import { Step, StepIndicator, StepSeperator, StepStatus, StepTitle, StepTrigger, Stepper, StepsList } from '~/components/ui/stepper';
import { useWatchForIntegrationRefresh } from '~/hooks/useWatchForIntegrationRefresh';
import { OnboardingStep, stepNumberToPath, stepPathToNumber, stepToPath, steps, useOnboardingStore } from '~/stores/onboarding-store';
import { api } from '~/trpc/client';
import { MIN_INTEGRATIONS_FOR_ONBOARDING } from '~/utils/constants';

export default function OnboardStepper() {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser } = useAuth();
  const { activeStep, activeStepIndex, setStep } = useOnboardingStore();
  const { data: integrations } = api.integrations.allIntegrationsForUser.useQuery();
  useWatchForIntegrationRefresh();

  const maxStepIndex = useMemo(() => {
    let maxStepIndex = 0;
    if (currentUser?.username) {
      maxStepIndex = 1;
    }
    if ((integrations ?? []).filter((i) => i.connections.length > 0).length >= MIN_INTEGRATIONS_FOR_ONBOARDING) {
      maxStepIndex = 2;
    }
    return maxStepIndex;
  }, [currentUser?.username, integrations]);

  const setStepAndRoute = useCallback(
    (step: OnboardingStep) => {
      const path = stepToPath.get(step)!;
      router.push(path);
    },
    [router],
  );

  const onContinue = useCallback(() => {
    const index = stepPathToNumber.get(pathname) ?? 0;
    if (index >= maxStepIndex) {
      return;
    }
    const step = steps.at(index + 1) ?? OnboardingStep.first;
    setStepAndRoute(step);
  }, [pathname, setStepAndRoute, maxStepIndex]);

  const onPrevousStep = useCallback(() => {
    const index = stepPathToNumber.get(pathname) ?? 0;
    console.log(index);
    if (index <= 0) {
      return;
    }
    const step = steps.at(index - 1) ?? OnboardingStep.first;
    setStepAndRoute(step);
  }, [pathname, setStepAndRoute]);

  const renderCurrentStep = useCallback(() => {
    switch (activeStep) {
      case OnboardingStep.first:
        return <ClaimUsernameStep canGoNext={maxStepIndex > 0} onNextStep={onContinue} />;
      case OnboardingStep.second:
        return <ConnectAccountsStep canGoNext={maxStepIndex > 1} onNextStep={onContinue} onPrevousStep={onPrevousStep} />;
      case OnboardingStep.third:
        return <PreviewProfileStep canGoNext={maxStepIndex > 1} onNextStep={() => router.push('/me')} onPrevousStep={onPrevousStep} />;
      default:
        return <div className="text-2xl text-destructive">These are not the droids you are looking for</div>;
    }
  }, [activeStep, maxStepIndex, onContinue, onPrevousStep, router]);

  useEffect(() => {
    const index = stepPathToNumber.get(pathname);
    if (index !== undefined) {
      const newStep = steps.at(index);
      if (newStep) {
        setStep(newStep);
      }
    } else {
      router.replace(stepNumberToPath.get(0)!);
    }
  }, [router, setStep, pathname]);

  return (
    <Stepper activeIndex={activeStepIndex} className="container max-w-screen-lg p-0" totalSteps={steps.length}>
      <StepsList>
        {steps.map((step, i) => (
          <Step index={i} key={step}>
            <StepTrigger disabled={i > maxStepIndex} onClick={() => setStepAndRoute(step)}>
              <StepIndicator>
                <StepStatus active={<p>{i + 1}</p>} complete={<LuCheck size={20} />} incomplete={<p>{i + 1}</p>} />
              </StepIndicator>
              <StepTitle>{step}</StepTitle>
            </StepTrigger>
            <StepSeperator />
          </Step>
        ))}
      </StepsList>
      {renderCurrentStep()}
    </Stepper>
  );
}
