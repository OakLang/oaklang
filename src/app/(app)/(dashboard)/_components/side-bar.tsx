'use client';

import {
  IoGlobeOutline,
  IoGlobeSharp,
  IoHomeOutline,
  IoHomeSharp,
  IoList,
  IoListOutline,
  IoPeople,
  IoPeopleOutline,
  IoPerson,
  IoPersonOutline,
  IoSettingsOutline,
  IoSettingsSharp,
} from 'react-icons/io5';
import { useMemo } from 'react';
import { useAuth } from '~/providers/AuthProvider';
import type { SidebarItem } from '~/utils/types';
import StickySideBar from '~/components/StickySideBar';

const ICON_SIZE = 24;

export default function AppSideBar() {
  const { currentUser, isLoading } = useAuth();

  const sidebarItems = useMemo(
    (): SidebarItem[] =>
      currentUser
        ? [
            {
              activeIcon: <IoHomeSharp size={ICON_SIZE} />,
              href: '/home',
              icon: <IoHomeOutline size={ICON_SIZE} />,
              label: 'Home',
            },
            {
              activeIcon: <IoGlobeSharp size={ICON_SIZE} />,
              extraMatches: [
                {
                  href: '/search',
                },
              ],
              href: '/explore',
              icon: <IoGlobeOutline size={ICON_SIZE} />,
              label: 'Explore',
            },
            {
              activeIcon: <IoPeople size={ICON_SIZE} />,
              href: '/leaders',
              icon: <IoPeopleOutline size={ICON_SIZE} />,
              label: 'Leaders',
            },
            ...(currentUser.username
              ? [
                  {
                    activeIcon: <IoList size={ICON_SIZE} />,
                    href: `/${currentUser.username}/lists`,
                    icon: <IoListOutline size={ICON_SIZE} />,
                    label: 'Lists',
                  },
                  {
                    activeIcon: <IoPerson size={ICON_SIZE} />,
                    excludePaths: [{ href: `/${currentUser.username}/lists` }],
                    extraMatches: [{ exact: true, href: '/me' }],
                    href: `/${currentUser.username}`,
                    icon: <IoPersonOutline size={ICON_SIZE} />,
                    label: 'Profile',
                  },
                ]
              : []),
            {
              activeIcon: <IoSettingsSharp size={ICON_SIZE} />,
              href: '/settings',
              icon: <IoSettingsOutline size={ICON_SIZE} />,
              label: 'Settings',
            },
          ]
        : [
            {
              activeIcon: <IoHomeSharp size={ICON_SIZE} />,
              exact: true,
              href: '/',
              icon: <IoHomeOutline size={ICON_SIZE} />,
              label: 'Home',
            },
            {
              activeIcon: <IoPeople size={ICON_SIZE} />,
              href: '/leaders',
              icon: <IoPeopleOutline size={ICON_SIZE} />,
              label: 'Leaders',
            },
          ],
    [currentUser],
  );

  return <StickySideBar isLoading={isLoading} items={sidebarItems} />;
}
