import { ObjectLiteral, SelectQueryBuilder } from 'typeorm';

export function applyDateRangeFilter(
  qb: SelectQueryBuilder<ObjectLiteral>,
  column: string,
  dateFrom?: string,
  dateTo?: string,
): void {
  if (dateFrom) {
    qb.andWhere(`${column} >= :dateFrom`, { dateFrom });
  }

  if (dateTo) {
    qb.andWhere(`${column} <= :dateTo`, { dateTo });
  }
}

export function applyCreatedDateRangeFilter(
  qb: SelectQueryBuilder<ObjectLiteral>,
  alias: string,
  dateFrom?: string,
  dateTo?: string,
): void {
  if (dateFrom) {
    qb.andWhere(`DATE(${alias}.created_at) >= :dateFrom`, { dateFrom });
  }

  if (dateTo) {
    qb.andWhere(`DATE(${alias}.created_at) <= :dateTo`, { dateTo });
  }
}
