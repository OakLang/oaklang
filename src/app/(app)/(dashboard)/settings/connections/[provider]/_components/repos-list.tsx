import Link from 'next/link';
import { useCallback, useMemo, useState } from 'react';
import { LuCheck, LuChevronsUpDown, LuLoader2, LuSearch } from 'react-icons/lu';
import { Button } from '~/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandSeparator } from '~/components/ui/command';
import { Input } from '~/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover';
import { api } from '~/trpc/client';
import { cn } from '~/utils';

export default function ReposList({ provider }: { provider: string }) {
  const reposQuery = api.integrations.getRepos.useQuery({ provider });
  const [selectedNamespace, setSelectedNamespace] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [open, setOpen] = useState(false);

  const filteredRepos = useMemo(() => {
    if (!reposQuery.isSuccess) {
      return [];
    }
    return reposQuery.data.filter((repo) => {
      const namespaceMatched = selectedNamespace === 'all' || repo.namespace === selectedNamespace;
      const searchQueryMatched = searchQuery ? repo.repoName.toLowerCase().startsWith(searchQuery.toLowerCase()) : true;
      return namespaceMatched && searchQueryMatched;
    });
  }, [reposQuery.data, reposQuery.isSuccess, searchQuery, selectedNamespace]);

  const namespaces = useMemo(() => {
    const _namespaces: string[] = ['all'];
    if (!reposQuery.isSuccess) {
      return _namespaces;
    }
    reposQuery.data.forEach((repo) => {
      if (!_namespaces.includes(repo.namespace)) {
        _namespaces.push(repo.namespace);
      }
    });
    return _namespaces;
  }, [reposQuery.data, reposQuery.isSuccess]);

  const handleConnectAdditionalRepos = useCallback(() => {
    if (provider !== 'github') {
      return;
    }
    if (typeof window === 'undefined') {
      return;
    }

    const newWindowHeight = screen.height * 0.7;
    const newWindowWidth = screen.height > 900 ? 900 : screen.height * 0.9;
    const x = screen.width / 2 - newWindowWidth / 2;
    const y = screen.height / 2 - newWindowHeight / 2;
    window.open(
      'https://github.com/apps/wonderful-dev/installations/new',
      'wonderful',
      `height=${newWindowHeight},width=${newWindowWidth},left=+${x}+,top=+${y}`,
    );
  }, [provider]);

  return (
    <div>
      {reposQuery.isLoading ? (
        <div className="flex items-center justify-center py-8">
          <LuLoader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : reposQuery.isError ? (
        <div className="p-4 text-muted-foreground">
          <p>{reposQuery.error.message}</p>
        </div>
      ) : (
        <div>
          <div className="sticky top-[104px] z-30 flex h-14 items-center gap-4 border-b bg-card px-4">
            <Popover onOpenChange={setOpen} open={open}>
              <PopoverTrigger asChild>
                <Button aria-expanded={open} className="w-[200px] justify-between" role="combobox" variant="outline">
                  <p>{selectedNamespace || 'Select a namespace'}</p>
                  <LuChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[200px] p-0">
                <Command>
                  <CommandInput className="h-9" placeholder="Search a Git Namespace..." />
                  <CommandEmpty>No results.</CommandEmpty>
                  {namespaces.length > 0 && (
                    <>
                      <CommandGroup>
                        {namespaces.map((namespace) => (
                          <CommandItem
                            key={namespace}
                            onSelect={(currentValue) => {
                              setSelectedNamespace(currentValue);
                              setOpen(false);
                            }}
                            value={namespace}
                          >
                            {namespace}
                            <LuCheck className={cn('ml-auto h-4 w-4', selectedNamespace === namespace ? 'opacity-100' : 'opacity-0')} />
                          </CommandItem>
                        ))}
                      </CommandGroup>
                      <CommandSeparator />
                    </>
                  )}
                  {provider === 'github' && (
                    <CommandGroup>
                      <div className="px-2 pb-1">
                        <p className="text-xs font-medium text-muted-foreground">Missing a repo?</p>
                      </div>
                      <CommandItem
                        onSelect={() => {
                          handleConnectAdditionalRepos();
                          setOpen(false);
                        }}
                        value="add-aditional-repos"
                      >
                        Connect additional repos
                      </CommandItem>
                    </CommandGroup>
                  )}
                </Command>
              </PopoverContent>
            </Popover>
            <form className="relative flex-1">
              <Input
                className="pl-8"
                onChange={(e) => {
                  setSearchQuery(e.currentTarget.value);
                }}
                placeholder="Search..."
                value={searchQuery}
              />
              <LuSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            </form>
          </div>
          {filteredRepos.length === 0 ? (
            <div className="p-4 text-muted-foreground">
              <p>No results</p>
            </div>
          ) : (
            <div>
              {filteredRepos.map((repo) => (
                <div className="border-b p-4 last:border-b-0" key={repo.id}>
                  <Link
                    className="font-medium hover:underline"
                    href={`https://github.com/${repo.full_name}`}
                    rel="nofollow noopener"
                    target="_blank"
                  >
                    {repo.repoName}
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
