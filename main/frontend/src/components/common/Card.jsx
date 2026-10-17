export default function Card({ title, subtitle, children, className = "", actions }) {
  return (
    <div
      className={`rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-surface-panelDark ${className}`}
    >
      {(title || actions) && (
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-700">
          <div>
            {title && <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">{title}</h3>}
            {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
          </div>
          {actions}
        </div>
      )}
      <div className="p-4">{children}</div>
    </div>
  );
}
