import { useCallback, useState } from 'react';
import { Button } from './ui/button';
import type { ButtonProps } from './ui/button';
import { Dialog } from './shared/Dialog';
import Link from 'next/link';
import { cn } from '~/utils';
import { usePathname } from 'next/navigation';
import { useAuth } from '~/providers/AuthProvider';

export default function FollowButton({
  onClick,
  isFollowing,
  classname,
  size = 'default',
  isLoading,
  disabled,
  userName,
  skipUnfollowAlert,
}: {
  classname?: string;
  disabled?: boolean;
  isFollowing?: boolean;
  isLoading?: boolean;
  onClick?: () => void;
  size?: ButtonProps['size'];
  skipUnfollowAlert?: boolean;
  userName?: string;
}) {
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();
  const [isHovering, setIsHovering] = useState(false);
  const [showUnfollowDialog, setShowUnfollowDialog] = useState(false);
  const [showUnauthenticatedDialog, setShowUnauthenticatedDialog] = useState(false);

  const handleToggle = useCallback(() => {
    if (!isAuthenticated) {
      setShowUnauthenticatedDialog(true);
      return;
    }
    if (isFollowing && !skipUnfollowAlert) {
      setShowUnfollowDialog(true);
      return;
    }
    onClick?.();
  }, [isAuthenticated, isFollowing, onClick, skipUnfollowAlert]);

  return (
    <>
      <Button
        className={cn(
          {
            'min-w-[90px]': isFollowing && size === 'sm',
            'min-w-[98px]': isFollowing && size === 'default',
          },
          classname,
        )}
        disabled={isLoading ?? disabled}
        onClick={handleToggle}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        size={size}
        variant={isFollowing ? (isHovering ? 'destructive' : 'outline') : 'default'}
      >
        {isFollowing ? (isHovering ? 'Unfollow' : 'Following') : 'Follow'}
      </Button>
      <Dialog
        description={`Are you sure you want to unfollow ${userName ?? 'user'}`}
        footer={
          <Button
            onClick={() => {
              setShowUnfollowDialog(false);
              onClick?.();
            }}
            variant="destructive"
          >
            Unfollow
          </Button>
        }
        onOpenChange={setShowUnfollowDialog}
        open={showUnfollowDialog}
        title={`Unfollow ${userName ?? 'User'}`}
      />

      <Dialog
        description={`Create an account to follow ${userName ?? 'user'}`}
        footer={
          <Button asChild>
            <Link
              href={{
                pathname: '/login',
                query: {
                  next: pathname,
                },
              }}
            >
              Log In
            </Link>
          </Button>
        }
        onOpenChange={setShowUnauthenticatedDialog}
        open={showUnauthenticatedDialog}
        title={`Follow ${userName ?? 'User'}`}
      />
    </>
  );
}
