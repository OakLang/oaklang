'use client';

import pluralize from 'pluralize';
import { FaGithub } from 'react-icons/fa6';
import { useAuth } from '~/providers/AuthProvider';
import Link from '~/components/shared/Link';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { api } from '~/trpc/client';

export default function GithubLogInCard() {
  const { currentUser } = useAuth();
  const { data: integrations } = api.integrations.allIntegrationsForUser.useQuery();

  const extraAccounts =
    integrations
      ?.filter((i) => i.name == 'GitHub')
      .flatMap((i) => i.connections)
      .filter((c) => c.providerAccountId !== String(currentUser?.githubId)) ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>GitHub login {pluralize('account', extraAccounts.length)}</CardTitle>
      </CardHeader>
      <CardContent>
        <Link className="flex items-end" href={currentUser?.githubProfileUrl ?? '#'} newWindow={true} showExternalIcon={true}>
          <FaGithub
            style={{
              display: 'inline-block',
              marginBottom: '3px',
              marginRight: '4px',
            }}
          />
          github.com/{currentUser?.githubUsername}
        </Link>
        {extraAccounts.length > 0 &&
          extraAccounts.map((c) => {
            return (
              <Link
                className="mt-1 flex items-end"
                href={`https://github.com/${c.providerAccountUsername}`}
                key={c.providerAccountUsername}
                newWindow={true}
              >
                <FaGithub
                  style={{
                    display: 'inline-block',
                    marginBottom: '3px',
                    marginRight: '4px',
                  }}
                />
                github.com/{c.providerAccountUsername}
              </Link>
            );
          })}
      </CardContent>
    </Card>
  );
}
