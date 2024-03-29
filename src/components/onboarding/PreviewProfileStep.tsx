'use client';

import { Avatar, AvatarFallback, AvatarImage } from 'src/components/ui/avatar';
import { Button } from 'src/components/ui/button';
import { Card } from 'src/components/ui/card';
import IntegrationsList from 'src/components/IntegrationsList';
import { LuUser } from 'react-icons/lu';
import pluralize from 'pluralize';
import { useAuth } from '~/providers/AuthProvider';

const PreviewProfileStep = ({
  onNextStep,
  canGoNext,
  onPrevousStep,
}: {
  canGoNext: boolean;
  onNextStep?: () => void;

  onPrevousStep?: () => void;
}) => {
  const { currentUser } = useAuth();

  if (!currentUser) {
    return null;
  }

  return (
    <div className="container my-8 max-w-xl px-4 md:my-16">
      <Card className="flex flex-col gap-4 p-4">
        <div className="flex flex-col gap-4 sm:flex-row">
          <Avatar className="h-20 w-20">
            <AvatarImage src={currentUser.avatarUrl} />
            <AvatarFallback>
              <LuUser size={32} />
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h3 className="text-xl font-semibold">{currentUser.name ?? currentUser.username}</h3>
            <p className="text-muted-foreground">@{currentUser.username}</p>
            <p className="mt-4">{currentUser.bio ?? 'AI-generated bio displayed after 3+ social profiles connected'}</p>
            <div className="mt-4 flex gap-4">
              <p className="text-muted-foreground">
                <span className="font-semibold text-foreground">{currentUser.followingCount}</span> Following
              </p>
              <p className="text-muted-foreground">
                <span className="font-semibold text-foreground">{currentUser.followersCount}</span>{' '}
                {pluralize('Follower', currentUser.followersCount)}
              </p>
            </div>
          </div>
        </div>

        <IntegrationsList userId={currentUser.id} />
      </Card>

      <div className="mt-8 flex">
        {onPrevousStep ? (
          <Button onClick={onPrevousStep} variant="secondary">
            Back
          </Button>
        ) : null}
        <div className="flex-1" />
        {onNextStep ? (
          <Button disabled={!canGoNext} onClick={onNextStep}>
            Done
          </Button>
        ) : null}
      </div>
    </div>
  );
};

export default PreviewProfileStep;
