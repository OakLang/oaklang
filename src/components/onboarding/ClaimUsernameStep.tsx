'use client';

import type { RefObject } from 'react';
import { stepNumberToPath, stepPathToNumber, steps, useOnboardingStore } from '~/stores/onboarding-store';
import { useEffect, useRef, useState } from 'react';
import { Button } from '~/components/ui/button';
import type { TRPCError } from '@trpc/server';
import { useDebounce } from 'usehooks-ts';
import { usePathname, useRouter } from 'next/navigation';
import { useWatchForIntegrationRefresh } from '~/hooks/useWatchForIntegrationRefresh';
import { validateUsername } from '~/utils/validators';
import UsernameInput from 'src/components/UsernameInput';
import { useAuth } from '~/providers/AuthProvider';
import { api } from '~/trpc/client';

const ClaimUsernameStep = ({ onNextStep, canGoNext }: { canGoNext: boolean; onNextStep: () => void }) => {
  const router = useRouter();
  const pathname = usePathname();
  const { currentUser, refetch: refetchCurrentUser } = useAuth();
  const { activeStep, setStep } = useOnboardingStore();
  const [username, setUsername] = useState(undefined as string | undefined);
  const debouncedUsername = useDebounce<string | undefined>(username, 700);
  const [usernameSaved, setUsernameSaved] = useState(false);
  const [usernameError, setUsernameError] = useState('');
  const updateUsername = api.users.updateUsername.useMutation();
  useWatchForIntegrationRefresh();

  useEffect(() => {
    const index = stepPathToNumber.get(pathname);
    if (index !== undefined) {
      const newStep = steps.at(index);
      if (newStep) {
        setStep(newStep);
      }
    } else {
      void router.replace(stepNumberToPath.get(0)!);
    }
  }, [router, setStep, pathname]);
  const nameInputReference: RefObject<HTMLInputElement> = useRef(null);
  useEffect(() => {
    nameInputReference.current?.focus();
  }, [activeStep]);

  useEffect(() => {
    if (!username) {
      setUsernameError('');
      return;
    }
    const form = validateUsername(username);
    if (form.error) {
      setUsernameError(form.error);
      setUsernameSaved(false);
      return;
    }
  }, [username]);

  useEffect(() => {
    void (async () => {
      if (!debouncedUsername) {
        return;
      }
      if (validateUsername(debouncedUsername).error) {
        return;
      }
      try {
        await updateUsername.mutateAsync(debouncedUsername);
      } catch (error) {
        setUsernameError((error as TRPCError).message || 'Something went wrong.');
        setUsernameSaved(false);
        return;
      }

      setUsernameError('');
      setUsernameSaved(true);
      if (refetchCurrentUser) {
        refetchCurrentUser();
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedUsername]);

  return (
    <div className="container my-8 max-w-lg px-4 md:my-16">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onNextStep();
        }}
      >
        <UsernameInput
          errorMessage={usernameError}
          hideEnterArrow
          onChange={(e) => setUsername(e.target.value)}
          ref={nameInputReference}
          resetWasSaved={() => setUsernameSaved(false)}
          value={username ?? currentUser?.username ?? ''}
          wasSaved={usernameSaved}
        />
        <div className="mt-4 flex">
          <div className="flex-1" />
          <Button disabled={!canGoNext || !!(!(username ?? currentUser?.username) || usernameError)} type="submit">
            Continue
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ClaimUsernameStep;
