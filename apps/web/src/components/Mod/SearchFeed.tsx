import type { AnyPublication, PublicationSearchRequest } from '@hey/lens';
import type { FC } from 'react';

import HigherActions from '@components/Publication/Actions/HigherActions';
import SinglePublication from '@components/Publication/SinglePublication';
import PublicationsShimmer from '@components/Shared/Shimmer/PublicationsShimmer';
import { RectangleStackIcon } from '@heroicons/react/24/outline';
import { isMirrorPublication } from '@hey/helpers/publicationHelpers';
import { LimitType, useSearchPublicationsQuery } from '@hey/lens';
import { Button, Card, EmptyState, ErrorMessage, Input } from '@hey/ui';
import { useEffect, useState } from 'react';
import { Virtuoso } from 'react-virtuoso';

import { useModFilterStore } from './Filter';

const SearchFeed: FC = () => {
  const {
    apps,
    customFilters,
    mainContentFocus,
    publicationTypes,
    refresh,
    setRefreshing
  } = useModFilterStore();

  const [query, setQuery] = useState('');

  // Variables
  const request: PublicationSearchRequest = {
    limit: LimitType.Fifty,
    query,
    where: {
      customFilters,
      metadata: {
        mainContentFocus,
        ...(apps && { publishedOn: apps })
      },
      publicationTypes: publicationTypes as any
    }
  };

  const { data, error, fetchMore, loading, refetch } =
    useSearchPublicationsQuery({
      skip: !query,
      variables: { request }
    });

  const search = data?.searchPublications;
  const publications = search?.items as AnyPublication[];
  const pageInfo = search?.pageInfo;
  const hasMore = pageInfo?.next;

  useEffect(() => {
    setRefreshing(true);
    refetch().finally(() => setRefreshing(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refresh, publicationTypes, mainContentFocus, customFilters]);

  const onEndReached = async () => {
    if (hasMore) {
      await fetchMore({
        variables: { request: { ...request, cursor: pageInfo?.next } }
      });
    }
  };

  const Search = () => {
    return (
      <div
        className="flex items-center space-x-2"
        // onSubmit={() => {
        //   Leafwatch.track(GARDENER.SEARCH_PUBLICATION, { query: value });
        //   setQuery(value);
        // }}
      >
        <Input
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search Publications"
          type="text"
          value={query}
        />
        <Button size="lg">Search</Button>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="space-y-5">
        <Search />
        <PublicationsShimmer />
      </div>
    );
  }

  if (!query || publications?.length === 0) {
    return (
      <div className="space-y-5">
        <Search />
        <EmptyState
          icon={<RectangleStackIcon className="size-8" />}
          message="No posts yet!"
        />
      </div>
    );
  }

  if (error) {
    return <ErrorMessage error={error} title="Failed to load search feed" />;
  }

  return (
    <div className="space-y-5">
      <Search />
      <Virtuoso
        className="[&>div>div]:space-y-5"
        components={{ Footer: () => <div className="pb-5" /> }}
        computeItemKey={(index, publication) => `${publication.id}-${index}`}
        data={publications}
        endReached={onEndReached}
        itemContent={(_, publication) => {
          const targetPublication = isMirrorPublication(publication)
            ? publication.mirrorOn
            : publication;

          return (
            <Card>
              <SinglePublication
                isFirst
                isLast={false}
                publication={publication as AnyPublication}
                showActions={false}
                showThread={false}
              />
              <div className="divider" />
              <HigherActions publication={targetPublication} />
            </Card>
          );
        }}
        useWindowScroll
      />
    </div>
  );
};

export default SearchFeed;
