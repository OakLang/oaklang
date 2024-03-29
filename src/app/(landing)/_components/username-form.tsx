'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '~/components/ui/button';
import { LuLoader2 } from 'react-icons/lu';
import type { TRPCError } from '@trpc/server';
import UsernameInput from '~/components/UsernameInput';
import { api } from '~/trpc/client';
import { useRouter } from 'next/navigation';
import { validateUsername } from '~/utils/validators';

export const UsernameForm = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [username, setUsername] = useState('');
  const router = useRouter();

  const findByUsername = api.users.findByUsername.useQuery(username);
  const claimUsername = api.users.claimUsername.useMutation();

  const nameInputReference: React.RefObject<HTMLInputElement> = useRef(null);

  const onChange = (val: string) => {
    setUsername(val);
    if (val === '') {
      setError('');
      return;
    }
    const form = validateUsername(val);
    if (form.error) {
      setError(form.error);
      return;
    }
    setLoading(false);
    setError('');
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (loading) {
      return;
    }
    setLoading(true);
    const form = validateUsername(username);
    if (form.error) {
      setLoading(false);
      setError(form.error);
      return;
    }

    try {
      await claimUsername.mutateAsync(username);
    } catch (error) {
      setLoading(false);
      setError((error as TRPCError).message || 'Something went wrong.');
      return;
    }

    router.push('/login');
  };

  useEffect(() => {
    nameInputReference.current?.focus();
  }, []);

  const errorMessage = (error || findByUsername.error?.message) ?? (findByUsername.data?.id ? 'Username not available.' : '');

  return (
    <form
      className="mt-8 flex w-full flex-col items-center"
      onSubmit={(e) => {
        void onSubmit(e);
      }}
    >
      <UsernameInput
        addErrorPlaceholder
        className="shadow-md"
        errorMessage={errorMessage}
        onChange={(e) => onChange(e.target.value)}
        ref={nameInputReference}
        value={username}
      />

      <Button className="mt-2 shadow-md" disabled={loading} tabIndex={2} type="submit">
        {loading ? <LuLoader2 className="-ml-1 mr-2 animate-spin" size={22} /> : null}
        Claim Your Profile
      </Button>
    </form>
  );
};
