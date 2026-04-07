export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export function getPaginationParams(searchParams: URLSearchParams): PaginationParams {
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  return {
    page: Math.max(1, page),
    limit: Math.min(100, Math.max(1, limit))
  };
}

export async function paginate<T>(
  query: Promise<T[]>,
  countQuery: Promise<number>,
  params: PaginationParams
): Promise<PaginatedResult<T>> {
  const page = params.page ?? 1;
  const limit = params.limit ?? 20;
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    query,
    countQuery
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    data,
    total,
    page,
    limit,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1
  };
}