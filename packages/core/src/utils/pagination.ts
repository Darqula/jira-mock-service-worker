export interface PaginationParams {
  startAt?: number;
  maxResults?: number;
}

export interface PagedResults<T> {
  startAt: number;
  maxResults: number;
  total: number;
  isLast: boolean;
  values: T[];
}

export function paginate<T>(
  items: T[],
  params: PaginationParams = {}
): PagedResults<T> {
  const startAt = params.startAt || 0;
  const maxResults = params.maxResults || 50;
  const total = items.length;
  const values = items.slice(startAt, startAt + maxResults);
  const isLast = startAt + values.length >= total;

  return {
    startAt,
    maxResults,
    total,
    isLast,
    values,
  };
}

export function parsePaginationParams(
  searchParams: URLSearchParams
): PaginationParams {
  const startAt = searchParams.get('startAt');
  const maxResults = searchParams.get('maxResults');

  return {
    startAt: startAt ? parseInt(startAt, 10) : undefined,
    maxResults: maxResults ? parseInt(maxResults, 10) : undefined,
  };
}
