import { JobCard } from '../entities/job-card.entity';

export interface JobCardsPaginatedResult {
  data: JobCard[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
