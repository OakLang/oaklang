import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar';
import type { FC, RefObject } from 'react';
import { LuAlertCircle, LuLoader2, LuUser } from 'react-icons/lu';
import { Tooltip, TooltipContent, TooltipTrigger } from '~/components/ui/tooltip';
import { useCallback, useRef, useState } from 'react';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { Dialog } from '~/components/shared/Dialog';
import { Input } from '~/components/ui/input';
import type { IntegrationWithConnections } from '~/utils/types';
import { IoSettingsOutline } from 'react-icons/io5';
import { Label } from '~/components/ui/label';
import Link from 'next/link';
import { Switch } from '~/components/ui/switch';
import { cn } from '~/utils';
import pluralize from 'pluralize';
import { useOnIntegrationToggle } from '~/hooks/useOnIntegrationToggle';
import { api } from '~/trpc/client';

export const IntegrationSwitch: FC<{
  integration: IntegrationWithConnections;
}> = ({ integration }) => {
  const [showModal, setShowModal] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  const inputRef: RefObject<HTMLInputElement> = useRef(null);
  const [manualUsername, setManualUsername] = useState('');
  const [manualInfo, setManualInfo] = useState<{ link: string | null; token: string | null }>({ link: null, token: null });
  const utils = api.useUtils();
  const manualInfoMut = api.integrations.manualIntegrationInfo.useMutation({
    onSuccess: setManualInfo,
  });
  const verifyManualIntegration = api.integrations.verifyManualIntegration.useMutation();

  const onClickManual = useCallback(() => {
    setShowModal(false);
    setShowManualModal(true);
    inputRef.current?.focus();
  }, [inputRef]);

  const clickToggleIntegration = useOnIntegrationToggle();

  const clickIntegration = useCallback(async () => {
    if (!integration.isConnected) {
      if (integration.isManualValidation) {
        manualInfoMut.mutate({ provider: integration.name, username: manualUsername });
        onClickManual();
      } else {
        await clickToggleIntegration(integration, onClickManual);
      }
      return;
    }
    setShowModal(true);
  }, [clickToggleIntegration, integration, manualInfoMut, manualUsername, onClickManual]);

  const connectAnother = useCallback(() => {
    if (integration.isManualValidation) {
      onClickManual();
      return;
    }

    if (typeof window === 'undefined') {
      return;
    }

    const newWindowHeight = screen.height * 0.7;
    const newWindowWidth = screen.height > 900 ? 900 : screen.height * 0.9;
    const x = screen.width / 2 - newWindowWidth / 2;
    const y = screen.height / 2 - newWindowHeight / 2;
    window.open(integration.oauthUrl, 'wonderful', `height=${newWindowHeight},width=${newWindowWidth},left=+${x}+,top=+${y}`);
  }, [integration.oauthUrl, integration.isManualValidation, onClickManual]);

  const onChangeManualUsername = useCallback(
    (username: string) => {
      setManualUsername(username);
      manualInfoMut.mutate({ provider: integration.name, username: username });
    },
    [integration.name, manualInfoMut],
  );

  const onClickVerify = useCallback(async () => {
    const res = await verifyManualIntegration.mutateAsync({ provider: integration.name, username: manualUsername });
    if (res.ok) {
      setShowManualModal(false);
      void utils.integrations.allIntegrationsForUser.refetch();
    }
  }, [integration.name, manualUsername, utils.integrations.allIntegrationsForUser, verifyManualIntegration]);

  return (
    <>
      <div className="flex items-center gap-4">
        <button
          className="flex flex-1 items-center p-3"
          disabled={integration.isAwaitingVerification}
          onClick={() => clickIntegration()}
          type="button"
        >
          {integration.icon ? (
            <span
              className={cn('mr-4 h-6 w-6 fill-muted-foreground', {
                'fill-primary': integration.isConnected,
              })}
              // eslint-disable-next-line react/no-danger
              dangerouslySetInnerHTML={{ __html: integration.icon }}
            />
          ) : null}
          <p
            className={cn({
              'fill-primary': integration.isConnected,
            })}
          >
            {integration.name}
          </p>
          {integration.isAwaitingVerification ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <LuAlertCircle className="ml-2 text-muted-foreground" size={16} />
              </TooltipTrigger>
              <TooltipContent>Waiting on {integration.name} app verification</TooltipContent>
            </Tooltip>
          ) : null}
          {integration.isConnected ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge className="ml-2" variant="outline">
                  {integration.connections.length}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                Total {integration.connections.length} {pluralize('integration', integration.connections.length)}
              </TooltipContent>
            </Tooltip>
          ) : null}
        </button>
        <Switch
          autoCorrect="off"
          checked={integration.isConnected}
          disabled={integration.isAwaitingVerification}
          onCheckedChange={() => void clickToggleIntegration(integration, onClickManual)}
        />
      </div>

      <Dialog
        footer={<Button onClick={connectAnother}>Connect another {integration.name} account</Button>}
        onOpenChange={setShowModal}
        open={showModal}
        title={
          <>
            {integration.name}{' '}
            <span className="font-medium text-muted-foreground">{`(${integration.connections.length} connected account${
              integration.connections.length == 1 ? '' : 's'
            })`}</span>
          </>
        }
      >
        <div className="space-y-2 p-6 pt-0">
          {integration.connections
            .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
            .map((connection) => {
              return (
                <Button asChild className="w-full justify-start text-left" key={connection.url} variant="outline">
                  <Link href={`/settings/connections/${connection.provider}`}>
                    <Avatar className="-ml-1 mr-2 h-6 w-6">
                      <AvatarImage src={connection.avatar} />
                      <AvatarFallback>
                        <LuUser size={16} />
                      </AvatarFallback>
                    </Avatar>
                    <p className="flex-1 truncate">
                      {connection.providerAccountUsername}
                      {!!connection.badgeText && ` - ${connection.badgeText}`}
                    </p>
                    <p className="flex-none">
                      <IoSettingsOutline />
                    </p>
                  </Link>
                </Button>
              );
            })}
        </div>
      </Dialog>

      <Dialog
        footer={
          <Button
            className="btn-sm mt-4"
            disabled={!manualInfo.token || verifyManualIntegration.isLoading}
            onClick={onClickVerify}
            type="submit"
            variant={verifyManualIntegration.data?.error ? 'destructive' : 'default'}
          >
            {verifyManualIntegration.isLoading ? <LuLoader2 className="-ml-1 mr-2" size={20} /> : null}
            Verify
          </Button>
        }
        onOpenChange={setShowManualModal}
        open={showManualModal}
        title={`Connect ${integration.name}`}
      >
        <div className="px-6">
          <fieldset>
            <Label>Enter your {integration.name} username</Label>
            <Input onChange={(e) => onChangeManualUsername(e.target.value)} placeholder="Username" ref={inputRef} value={manualUsername} />
          </fieldset>
          {manualInfo.token && manualInfo.link ? (
            <fieldset>
              <Label>Add the verification code to your {integration.name} profile</Label>
              <Input readOnly value={manualInfo.token} />
              <p className="mt-2 text-sm text-muted-foreground">
                Open {integration.name}{' '}
                <Link className="underline-offset-4 hover:text-primary hover:underline" href={manualInfo.link} target="_blank">
                  {manualInfo.link}
                </Link>
              </p>
            </fieldset>
          ) : null}
        </div>
      </Dialog>
    </>
  );
};
