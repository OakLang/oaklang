import type { ReactNode } from 'react';
import BackButton from './BackButton';

export default function TitleBar({
  title,
  trailing,
  leading,
  hideBackButton,
  bottom,
  backHref,
}: {
  backHref?: string;
  bottom?: ReactNode;
  hideBackButton?: boolean;
  leading?: ReactNode;
  title: string | ReactNode;
  trailing?: ReactNode;
}) {
  return (
    <header className="sticky top-16 z-30 border-b bg-card md:top-0">
      <div className="flex h-14 items-center gap-2 px-2">
        {leading ?? (!hideBackButton && <BackButton href={backHref} />)}
        <div className="flex-1 px-2">
          {typeof title === 'string' ? <p className="line-clamp-1 text-lg font-bold leading-6">{title}</p> : title}
        </div>
        {trailing}
      </div>
      {bottom}
    </header>
  );
}
