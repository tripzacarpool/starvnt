import clsx from 'clsx';
import type { InquiryStatus, Priority } from '../lib/types';

export function StatusPill({ status }: { status: InquiryStatus }) {
  return <span className={clsx('pill', status.toLowerCase().replace('_', '-'))}>{status.replace('_', ' ')}</span>;
}

export function PriorityPill({ priority }: { priority: Priority }) {
  return <span className={clsx('priority', priority.toLowerCase())}>{priority}</span>;
}
