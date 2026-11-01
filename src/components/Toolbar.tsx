interface ToolbarProps {
  muted: boolean;
  lit: boolean;
  onToggleMute: () => void;
  onToggleDiyas: () => void;
  onShow: () => void;
  onBomb: () => void;
}

const btn =
  "btn-ghost whitespace-nowrap rounded-xl px-3 py-2 text-sm text-amber-50 hover:scale-105 active:scale-95";

export default function Toolbar({ muted, lit, onToggleMute, onToggleDiyas, onShow, onBomb }: ToolbarProps) {
  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-40 flex items-center justify-between gap-3 px-4 py-3">
      <div className="glass hidden items-center gap-2 rounded-2xl px-4 py-2 sm:flex">
        <span className="text-xl">🪔</span>
        <span className="text-gold font-display text-sm">Deepavali</span>
      </div>
      <nav className="glass ml-auto flex flex-wrap items-center justify-end gap-2 rounded-2xl p-2">
        <button data-ui type="button" className={btn} onClick={onToggleMute} aria-label="Toggle sound">
          {muted ? "🔇 Muted" : "🔊 Sound"}
        </button>
        <button data-ui type="button" className={btn} onClick={onToggleDiyas}>
          {lit ? "🌑 Dim Diyas" : "🪔 Light Diyas"}
        </button>
        <button data-ui type="button" className={btn} onClick={onShow}>
          🎆 Show
        </button>
        <button data-ui type="button" className={btn} onClick={onBomb}>
          💣 Bomb
        </button>
        <a data-ui href="#wishes" className={btn}>
          💌 Wishes
        </a>
      </nav>
    </header>
  );
}
