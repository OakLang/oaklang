import Link from 'next/link';
import { ThemeToggle } from '~/components/ThemeToggle';

type LinkItem = {
  external?: boolean;
  href: string;
  label: string;
};

type LinkGroup = {
  items: LinkItem[];
  title: string;
};

const linkGroups: LinkGroup[] = [
  {
    items: [
      {
        href: '/privacy',
        label: 'Privacy',
      },
      {
        href: '/terms',
        label: 'Terms',
      },
    ],
    title: 'Legal',
  },
];

export default function Footer() {
  return (
    <footer className="border-t bg-card">
      <div className="container grid max-w-screen-xl gap-6 px-4 py-16 md:grid-cols-3 md:px-8">
        <div className="md:col-span-2">
          <Link className="text-lg font-bold text-foreground" href="/">
            wonderful.dev
          </Link>
          <p className="mt-4 leading-normal text-muted-foreground">The social network for techies.</p>
        </div>
        {linkGroups.map((group) => (
          <div key={group.title}>
            <p className="font-semibold">{group.title}</p>
            <ul className="mt-4 space-y-2">
              {group.items.map((item) => (
                <li key={item.href}>
                  <Link
                    className="font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                    href={item.href}
                    target={item.external ? '_blank' : undefined}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="container max-w-screen-xl px-4 md:px-8">
        <div className="flex flex-wrap items-center justify-between border-t py-8">
          <p className="text-muted-foreground">
            Powered by{' '}
            <Link className="font-medium underline-offset-4 hover:text-foreground hover:underline" href="https://wakatime.com">
              WakaTime
            </Link>
          </p>
          <ThemeToggle />
        </div>
      </div>
    </footer>
  );
}
