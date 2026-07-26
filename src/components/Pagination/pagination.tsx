import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

function getPageList(current: number, total: number): (number | 'ellipsis')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages: (number | 'ellipsis')[] = [1];

  if (current > 3) pages.push('ellipsis');

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let p = start; p <= end; p++) pages.push(p);

  if (current < total - 2) pages.push('ellipsis');

  pages.push(total);
  return pages;
}

export default function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = getPageList(currentPage, totalPages);

  const baseBtn =
    'inline-flex items-center justify-center h-9 min-w-9 px-2 rounded-lg text-sm font-mono transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 dark:focus-visible:ring-primary-400 disabled:opacity-40 disabled:pointer-events-none';

  return (
    <nav
      aria-label="Blog pagination"
      className="flex items-center justify-center gap-1.5 mt-12"
    >
      <button
        type="button"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        aria-label="Previous page"
        className={`${baseBtn} border border-surface-200 dark:border-white/10 text-surface-500 dark:text-surface-400 hover:text-primary-600 dark:hover:text-primary-400 hover:border-primary-600/40 dark:hover:border-primary-400/40`}
      >
        <ChevronLeft size={16} />
      </button>

      {pages.map((p, i) =>
        p === 'ellipsis' ? (
          <span
            key={`ellipsis-${i}`}
            className="inline-flex items-center justify-center h-9 min-w-9 text-sm text-surface-400 dark:text-surface-600"
          >
            …
          </span>
        ) : (
          <button
            type="button"
            key={p}
            onClick={() => onPageChange(p)}
            aria-current={p === currentPage ? 'page' : undefined}
            className={
              p === currentPage
                ? `${baseBtn} bg-primary-600 dark:bg-primary-500 text-white`
                : `${baseBtn} border border-surface-200 dark:border-white/10 text-surface-600 dark:text-surface-400 hover:text-primary-600 dark:hover:text-primary-400 hover:border-primary-600/40 dark:hover:border-primary-400/40`
            }
          >
            {p}
          </button>
        )
      )}

      <button
        type="button"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        aria-label="Next page"
        className={`${baseBtn} border border-surface-200 dark:border-white/10 text-surface-500 dark:text-surface-400 hover:text-primary-600 dark:hover:text-primary-400 hover:border-primary-600/40 dark:hover:border-primary-400/40`}
      >
        <ChevronRight size={16} />
      </button>
    </nav>
  );
}