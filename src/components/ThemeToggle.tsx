'use client';

import { LuMoon, LuSun } from 'react-icons/lu';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { Button } from '~/components/ui/button';
import { useTheme } from 'next-themes';

export function ThemeToggle() {
  const { setTheme, theme } = useTheme();

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          onClick={(e) => {
            e.preventDefault();
            setTheme(theme === 'light' ? 'dark' : 'light');
          }}
          size="icon"
          variant="outline"
        >
          <LuSun className="dark:hidden" size={22} />
          <LuMoon className="hidden dark:block" size={22} />
          <span className="sr-only dark:hidden">Switch to light mode</span>
          <span className="sr-only hidden dark:block">Switch to dark mode</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <span className="dark:hidden">Switch to light mode</span>
        <span className="hidden dark:block">Switch to dark mode</span>
      </TooltipContent>
    </Tooltip>
  );
}
