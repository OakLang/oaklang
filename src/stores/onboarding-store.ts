import { createStore, useStore } from 'zustand';
import { devtools } from 'zustand/middleware';

export type OnboardingType = {
  activeStep: OnboardingStep;
  activeStepIndex: number;
  setStep: (step: OnboardingStep) => void;
  steps: typeof steps;
};
export enum OnboardingStep {
  first = 'Claim your Username',
  second = 'Connect some Accounts',
  third = 'Preview your Profile',
}
export const steps: Array<OnboardingStep> = [OnboardingStep.first, OnboardingStep.second, OnboardingStep.third];
export const stepToPath = new Map<OnboardingStep, string>();
export const stepNumberToPath = new Map<number, string>();
export const stepPathToNumber = new Map<string, number>();
steps.forEach((step, i) => {
  const stepPath = `/onboard/step/${step.replaceAll(' ', '-').toLowerCase()}`;
  stepToPath.set(step, stepPath);
  stepPathToNumber.set(stepPath, i);
  stepNumberToPath.set(i, stepPath);
});
export const OnboardingStore = createStore<OnboardingType>()(
  devtools(
    (set) => ({
      activeStep: OnboardingStep.first,
      activeStepIndex: 0,
      setStep: (newStep) => {
        set((state) => {
          const index = steps.indexOf(newStep);
          if (index > -1) {
            return {
              activeStep: newStep,
              activeStepIndex: index,
            };
          }
          return {
            activeStep: state.activeStep,
            activeStepIndex: state.activeStepIndex,
          };
        });
      },
      steps,
    }),
    {
      name: 'OnboardingStore',
    },
  ),
);

export const useOnboardingStore = () => useStore(OnboardingStore);
