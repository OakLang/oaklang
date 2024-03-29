import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Fragment, useMemo } from 'react';
import { LuExternalLink, LuUser } from 'react-icons/lu';

import { Button } from './ui/button';
import { Dialog } from './shared/Dialog';
import type { EditProfileIntegration } from '~/utils/types';
import Link from 'next/link';

export default function IntegrationShield({ integration }: { integration: EditProfileIntegration }) {
  const links = useMemo(
    () =>
      integration.connections
        .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
        .map((c) => {
          return {
            href: c.url,
            image: c.avatar,
            links: c.subConnections?.sort((a, b) => {
              return b.score - a.score;
            }),
            suffixText: c.badgeText,
            text: c.providerAccountUsername,
          };
        }),
    [integration],
  );

  return (
    <Dialog
      title={
        <>
          {integration.name}{' '}
          <span className="text-sm text-muted-foreground">{`(${integration.connections.length} connected account${
            integration.connections.length == 1 ? '' : 's'
          })`}</span>
        </>
      }
      tooltip={integration.name}
      trigger={
        <Button className="justify-start text-left max-sm:h-8 max-sm:px-3" key={integration.name} variant="outline">
          <span
            className="-ml-1 mr-2 h-4 w-4 fill-current sm:h-5 sm:w-5"
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{ __html: integration.icon }}
          />
          <p className="ml-1 text-sm font-normal text-muted-foreground">{integration.badgeText}</p>
        </Button>
      }
    >
      <div className="space-y-2 overflow-hidden p-6 pt-0">
        {links.map((link) => {
          return (
            <Fragment key={link.href}>
              <Button asChild className="w-full justify-start text-left" variant="outline">
                <Link href={link.href} rel="nofollow noopener" target="_blank">
                  <Avatar className="-ml-1 mr-2 h-6 w-6">
                    <AvatarImage src={link.image} />
                    <AvatarFallback>
                      <LuUser size={16} />
                    </AvatarFallback>
                  </Avatar>
                  <p className="flex-1 truncate">
                    {link.text}
                    {!!link.suffixText && ` - ${link.suffixText}`}
                  </p>
                  <LuExternalLink className="-mr-1 ml-2" size={18} />
                </Link>
              </Button>
              {link.links?.map((sub) => {
                return (
                  <Button asChild className="w-full justify-start text-left" key={`${sub.href}`} variant="outline">
                    <Link href={sub.href} rel="nofollow noopener" target="_blank">
                      <Avatar className="-ml-1 mr-2 h-6 w-6">
                        <AvatarImage src={sub.image} />
                        <AvatarFallback>
                          <LuUser size={16} />
                        </AvatarFallback>
                      </Avatar>
                      <p className="flex-1 truncate">
                        {sub.text}
                        {!!sub.text && ` - ${sub.text}`}
                      </p>
                      <LuExternalLink className="-mr-1 ml-2" size={18} />
                    </Link>
                  </Button>
                );
              })}
            </Fragment>
          );
        })}
      </div>
    </Dialog>
  );
}
