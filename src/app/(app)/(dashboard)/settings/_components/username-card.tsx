'use client';

import type { TRPCError } from '@trpc/server';
import { useEffect, useState } from 'react';
import { useDebounce } from 'usehooks-ts';
import { useAuth } from '~/providers/AuthProvider';
import UsernameInput from '~/components/UsernameInput';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card';
import { api } from '~/trpc/client';
import { APP_NAME } from '~/utils/constants';
import { validateUsername } from '~/utils/validators';

export default function UsernameCard() {
  const { currentUser, refetch: refetchCurrentUser } = useAuth();
  const [username, setUsername] = useState(undefined as string | undefined);
  const debouncedUsername = useDebounce<string | undefined>(username, 700);
  const [usernameSaved, setUsernameSaved] = useState(false);
  const [usernameError, setUsernameError] = useState('');

  const updateUsername = api.users.updateUsername.useMutation();

  useEffect(() => {
    {
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
    <Card>
      <CardHeader>
        <CardTitle>Username</CardTitle>
        <CardDescription>This is your URL namespace within {APP_NAME}.</CardDescription>
      </CardHeader>
      <CardContent>
        <UsernameInput
          errorMessage={usernameError}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Username"
          resetWasSaved={() => setUsernameSaved(false)}
          value={username ?? currentUser?.username ?? ''}
          wasSaved={usernameSaved}
        />
      </CardContent>
    </Card>
  );
}
