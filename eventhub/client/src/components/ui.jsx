export const Spinner = ({ label = 'Loading…' }) => (
  <div className="flex items-center justify-center gap-3 py-16 text-slate-500">
    <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-brand-600" />
    {label}
  </div>
);

export const ErrorBox = ({ message, onRetry }) => (
  <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
    {message}
    {onRetry && <button onClick={onRetry} className="ml-3 font-semibold underline">Retry</button>}
  </div>
);

export const TypeBadge = ({ type }) => (
  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${type === 'team' ? 'bg-purple-100 text-purple-700' : 'bg-sky-100 text-sky-700'}`}>
    {type === 'team' ? 'Team' : 'Individual'}
  </span>
);

export const StatusBadge = ({ status }) => {
  const map = {
    present: 'bg-emerald-100 text-emerald-700',
    late: 'bg-amber-100 text-amber-700',
    absent: 'bg-red-100 text-red-700',
  };
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${map[status] || 'bg-slate-100 text-slate-500'}`}>{status || 'not marked'}</span>;
};
