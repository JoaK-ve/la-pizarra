export default function FilterPill({ label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        'px-3.5 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors border ' +
        (active
          ? 'bg-brand text-brand-contrast border-brand'
          : 'bg-transparent text-text/70 border-text/20 hover:border-text/40 hover:text-text')
      }
    >
      {label}
    </button>
  )
}
