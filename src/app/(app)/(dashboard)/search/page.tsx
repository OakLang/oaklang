import type { Metadata } from 'next';
import { RedirectType, redirect } from 'next/navigation';
import TitleBar from '~/components/TitleBar';
import SearchForm from '~/components/SearchForm';
import { APP_NAME } from '~/utils/constants';
import UserSearchResult from './_components/user-search-result';

type Props = {
  searchParams: {
    q?: string;
  };
};

export const generateMetadata = ({ searchParams }: Props) => {
  return {
    title: `${searchParams.q} - Search - ${APP_NAME}`,
  } satisfies Metadata;
};

export default function SearchPage({ searchParams }: Props) {
  if (!searchParams.q?.trim()) {
    redirect('/explore', RedirectType.replace);
  }

  return (
    <main>
      <TitleBar title={<SearchForm defaultValue={searchParams.q} />} />
      <UserSearchResult searchText={searchParams.q} />
    </main>
  );
}
