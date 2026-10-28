import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { getCatalog, getTitle } from "../api/catalog.js";

export function useCatalog(query, format) {
  const search = query.trim();
  return useInfiniteQuery({
    queryKey: ['catalog', 'kitsu', search, format],
    initialPageParam: { manga: 1, manhwa: 1 },
    queryFn: ({ pageParam, signal }) => getCatalog(search, format, pageParam, signal),
    getNextPageParam: (lastPage) => lastPage.nextPage,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: false,
    refetchOnWindowFocus: false
  });
}

export function useTitle(id) {
  return useQuery({
    queryKey: ['title', 'kitsu', id],
    queryFn: ({ signal }) => getTitle(id, signal),
    staleTime: 30 * 60 * 1000,
    retry: false,
    refetchOnWindowFocus: false
  });
}
