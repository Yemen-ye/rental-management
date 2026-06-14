export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export const parsePagination = (query: Record<string, unknown>): PaginationParams => ({
  page: Math.max(1, parseInt(String(query.page || 1), 10)),
  limit: Math.min(100, Math.max(1, parseInt(String(query.limit || 20), 10))),
  sortBy: String(query.sortBy || 'createdAt'),
  sortOrder: (String(query.sortOrder || 'desc') as 'asc' | 'desc'),
});

export const paginate = <T>(data: T[], total: number, params: PaginationParams): PaginatedResult<T> => {
  const totalPages = Math.ceil(total / params.limit);
  return {
    data,
    meta: {
      page: params.page,
      limit: params.limit,
      total,
      totalPages,
      hasNext: params.page < totalPages,
      hasPrev: params.page > 1,
    },
  };
};
