import { LuMoon, LuSun } from 'react-icons/lu';

import { DropdownMenuItem } from './ui/dropdown-menu';
import React from 'react';
import { useTheme } from 'next-themes';

export default function ThemeToggleDropdownItem() {
  const { setTheme, theme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  return (
    <DropdownMenuItem onClick={toggleTheme}>
      <LuSun className="mr-2 dark:hidden" size={22} />
      <LuMoon className="mr-2 hidden dark:block" size={22} />
      <span className="dark:hidden">Light mode</span>
      <span className="hidden dark:block">Dark mode</span>
    </DropdownMenuItem>
  );
}
