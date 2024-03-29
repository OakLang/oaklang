import Image from 'next/image';
import Link from '~/components/shared/Link';
import type { TimelineTemplate } from '~/utils/types';
import { TimelineTemplateType } from '~/utils/types';

interface Props {
  items: TimelineTemplate[];
}

export default function TimelineTemplateComposer(props: Props) {
  const { items } = props;

  return items.map((item, i) => {
    switch (item.type) {
      case TimelineTemplateType.text:
        // eslint-disable-next-line react/no-array-index-key
        return <span key={i}>{item.text}</span>;
      case TimelineTemplateType.link: {
        const link = item;
        if (typeof link.children === 'string') {
          return (
            // eslint-disable-next-line react/no-array-index-key
            <Link href={item.href} isExternal key={i} newWindow showExternalIcon variant="inline">
              {link.children}
            </Link>
          );
        }
        return (
          // eslint-disable-next-line react/no-array-index-key
          <Link href={item.href} isExternal key={i} newWindow showExternalIcon variant="inline">
            <TimelineTemplateComposer items={link.children} />
          </Link>
        );
      }
      case TimelineTemplateType.icon_svg: {
        const icon = `data:image/svg+xml;utf8,${encodeURIComponent(item.icon)}`;
        // eslint-disable-next-line react/no-array-index-key
        return <Image alt="icon" className="integration-icon" height="16" key={i} src={icon} width="16" />;
      }
      case TimelineTemplateType.avatar: {
        const avatarUrl = item.avatarUrl;
        // eslint-disable-next-line react/no-array-index-key
        return <Image alt="icon" className="mr-1 inline h-5 w-5 rounded-sm border" height="16" key={i} src={avatarUrl} width="16" />;
      }
    }
  });
}
