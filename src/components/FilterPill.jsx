export default function FilterPill({ label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        'px-3.5 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors border ' +
        (active
          ? 'bg-amber text-bg border-amber'
          : 'bg-transparent text-paper/70 border-paper/20 hover:border-paper/40 hover:text-paper')
      }
    >
      {label}
    </button>
  )
}
