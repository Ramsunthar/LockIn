// The four buckets are fixed (see docs/product-spec.md). The array is the
// single source of truth; the union type is derived from it.
export const BUCKETS = ['study', 'dsa', 'project', 'applications'] as const;
export type Bucket = (typeof BUCKETS)[number];

export const BUCKET_LABELS: Record<Bucket, string> = {
  study: 'Study',
  dsa: 'DSA',
  project: 'Project',
  applications: 'Applications',
};

export type DayStatus = 'active' | 'grace' | 'missed';
export type TaskStatus = 'pending' | 'done';

export type PlannedTask = {
  id: string;
  for_date: string;
  bucket: Bucket;
  label: string | null;
  status: TaskStatus;
  position: number;
};
