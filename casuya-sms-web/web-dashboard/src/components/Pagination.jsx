export default function Pagination({ page, pageSize, total, onPage }) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (total <= pageSize) return null;

  return (
    <div className="pagination">
      <button onClick={() => onPage(page - 1)} disabled={page <= 1}>
        Previous
      </button>
      <span className="pagination-info">
        Page {page} of {totalPages}
      </span>
      <button onClick={() => onPage(page + 1)} disabled={page >= totalPages}>
        Next
      </button>
      <span className="pagination-total">{total} total</span>
    </div>
  );
}
