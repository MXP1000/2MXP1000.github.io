import { useEffect, useState } from "react";

const LINES = [
  "Wishing you light, love & prosperity ✨",
  "May your home glow with happiness 🪔",
  "Sweets, sparkles & endless joy 🍬",
  "Shubh Deepavali to you and your family 🎆",
];

const DIWALI_2026 = new Date("2026-11-08T00:00:00+05:30").getTime();

function useTypewriter(lines: string[]) {
  const [line, setLine] = useState(0);
  const [shown, setShown] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const full = lines[line];
    let delay = deleting ? 28 : 65;
    if (!deleting && shown === full) delay = 1800;
    if (deleting && shown === "") delay = 300;
    const t = window.setTimeout(() => {
      if (!deleting) {
        if (shown === full) setDeleting(true);
        else setShown(full.slice(0, shown.length + 1));
      } else if (shown.length > 0) {
        setShown(shown.slice(0, -1));
      } else {
        setDeleting(false);
        setLine((l) => (l + 1) % lines.length);
      }
    }, delay);
    return () => window.clearTimeout(t);
  }, [shown, deleting, line, lines]);

  return shown;
}

function Countdown() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const diff = Math.max(0, DIWALI_2026 - now);
  const parts: [string, number][] = [
    ["Days", Math.floor(diff / 86400000)],
    ["Hours", Math.floor(diff / 3600000) % 24],
    ["Minutes", Math.floor(diff / 60000) % 60],
    ["Seconds", Math.floor(diff / 1000) % 60],
  ];

  return (
    <div className="mt-8 w-full">
      <p className="mb-3 text-xs uppercase tracking-[0.3em] text-amber-200/70">
        {diff === 0 ? "🎉 Diwali is here!" : "Countdown to Diwali 2026"}
      </p>
      <div className="flex justify-center gap-3">
        {parts.map(([label, value]) => (
          <div key={label} className="glass flex w-20 flex-col items-center rounded-2xl py-3 sm:w-24">
            <span className="font-display text-2xl text-amber-100 sm:text-3xl">
              {String(value).padStart(2, "0")}
            </span>
            <span className="mt-1 text-[10px] uppercase tracking-widest text-amber-200/70">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

interface HeroProps {
  onShow: () => void;
}

export default function Hero({ onShow }: HeroProps) {
  const shown = useTypewriter(LINES);

  return (
    <div className="relative mx-auto flex max-w-4xl flex-col items-center px-4 text-center">
      <p className="rise glass mb-6 rounded-full px-5 py-2 text-xs uppercase tracking-[0.35em] text-amber-200">
        ✨ Festival of Lights ✨
      </p>
      <h1 className="text-gold title-glow font-display text-5xl leading-tight sm:text-7xl md:text-8xl">
        Happy Diwali
      </h1>
      <div className="mt-6 min-h-[2rem] text-lg text-amber-100/90 sm:text-xl">
        <span className="font-light italic">{shown}</span>
        <span className="caret" />
      </div>

      <Countdown />

      <div className="mt-10 flex flex-wrap justify-center gap-4">
        <a href="#wishes" className="btn-gold rounded-2xl px-7 py-3 text-base">
          💌 Write a Wish
        </a>
        <button type="button" onClick={onShow} className="btn-ghost rounded-2xl px-7 py-3 text-base text-amber-50">
          🎆 Launch Fireworks
        </button>
      </div>

      <p className="mt-10 max-w-xl text-xs leading-relaxed text-amber-100/60">
        Click the sky to launch rockets · Double-click for a 💣 atom bomb · Drag for ✨ sparklers
        <br />
        Keys: <kbd className="rounded bg-white/10 px-1">F</kbd> fireworks ·{" "}
        <kbd className="rounded bg-white/10 px-1">B</kbd> bomb ·{" "}
        <kbd className="rounded bg-white/10 px-1">D</kbd> diyas ·{" "}
        <kbd className="rounded bg-white/10 px-1">M</kbd> mute
      </p>
      <div className="mt-8 animate-bounce text-xl text-amber-200/70">↓</div>
    </div>
  );
}
