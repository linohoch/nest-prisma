enum SortOrder {
  desc = 'desc',
  asc = 'asc',
}

export type PageSelect = {
  page: number;
  skip: number;
  take: number;
  sortOrder: SortOrder;
  startCursor: number;
  endCursor: number;
};
export type Pagination = {
  sortOrder: SortOrder;
  skip: number;
  take: number;
  currentPage: number;
  totalPage: number;
  pageSize: number;
};
