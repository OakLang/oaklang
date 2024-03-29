'use client';

import { useMemo } from 'react';
import { FiGithub, FiUsers } from 'react-icons/fi';
import { HiMiniCog6Tooth, HiServerStack } from 'react-icons/hi2';
import { TbWorldBolt } from 'react-icons/tb';
import { FaRobot } from 'react-icons/fa6';
import type { SidebarItem } from '~/utils/types';
import { useAuth } from '~/providers/AuthProvider';
import StickySideBar from '~/components/StickySideBar';

const ICON_SIZE = 24;

export default function AdminSideBar() {
  const { isLoading } = useAuth();

  const sidebarItems = useMemo(
    (): SidebarItem[] => [
      {
        children: [
          {
            href: '/admin/users/login-links',
            label: 'Login Links',
          },
        ],
        excludePaths: [{ href: '/admin/users/login-links' }],
        href: '/admin/users',
        icon: <FiUsers size={ICON_SIZE} />,
        label: 'Users',
      },
      {
        href: '/admin/repos',
        icon: <FiGithub size={ICON_SIZE} />,
        label: 'Repos',
      },
      {
        href: '/admin/integrations',
        icon: <TbWorldBolt size={ICON_SIZE} />,
        label: 'Integrations',
      },
      {
        href: '/admin/tasks',
        icon: <HiServerStack size={ICON_SIZE} />,
        label: 'Background Tasks',
      },
      {
        href: '/admin/bios',
        icon: <FaRobot size={ICON_SIZE} />,
        label: 'Bios',
      },
      {
        href: '/admin/infra',
        icon: <HiMiniCog6Tooth size={ICON_SIZE} />,
        label: 'Infra',
      },
    ],
    [],
  );

  return <StickySideBar isLoading={isLoading} items={sidebarItems} />;
}
