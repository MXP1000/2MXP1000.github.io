import { useState } from "react";
import WishCard from "./WishCard";
import { TONES, makeWish } from "../data/wishes";
import type { Tone, Wish } from "../data/wishes";
import * as sfx from "../audio/sfx";

interface WishComposerProps {
  onCelebrate: () => void;
}

export default function WishComposer({ onCelebrate }: WishComposerProps) {
  const [name, setName] = useState("");
  const [tone, setTone] = useState<Tone>("Traditional");
  const [wish, setWish] = useState<Wish | null>(null);
  const [copied, setCopied] = useState(false);

  const generate = () => {
    setWish(makeWish(name.trim() || "Dear friend", tone));
    setCopied(false);
    sfx.bells();
    onCelebrate();
  };

  const copy = async () => {
    if (!wish) return;
    try {
      await navigator.clipboard.writeText(wish.text);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <section id="wishes" className="relative z-20 mx-auto grid max-w-6xl gap-8 px-6 py-24 md:grid-cols-2 md:items-center">
      <div className="glass rise rounded-3xl p-8">
        <p className="text-xs uppercase tracking-[0.3em] text-amber-300/80">Create</p>
        <h2 className="text-gold font-display mt-2 text-3xl md:text-4xl">Craft Your Diwali Wish</h2>
        <p className="mt-3 text-amber-100/70">
          Enter a name, pick a vibe, and we'll write a personal wish, then send it up in fireworks.
        </p>

        <label htmlFor="wish-name" className="mt-6 block text-sm text-amber-100/80">
          Name
        </label>
        <input
          id="wish-name"
          data-ui
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && generate()}
          maxLength={24}
          placeholder="e.g. Priya"
          className="pointer-events-auto mt-2 w-full rounded-xl border border-amber-200/25 bg-black/30 px-4 py-3 text-amber-50 outline-none placeholder:text-amber-100/40 focus:border-amber-300 focus:ring-2 focus:ring-amber-400/40"
        />

        <div className="mt-5 flex flex-wrap gap-2">
          {TONES.map((t) => (
            <button
              key={t}
              data-ui
              type="button"
              onClick={() => setTone(t)}
              className={`rounded-full px-4 py-2 text-sm ${tone === t ? "btn-gold" : "btn-ghost text-amber-100/80"}`}
            >
              {t}
            </button>
          ))}
        </div>

        <button
          data-ui
          type="button"
          onClick={generate}
          className="btn-gold mt-8 w-full rounded-xl py-3 text-base"
        >
          ✨ Generate Wish
        </button>
      </div>

      <div className="flex flex-col items-center">
        {wish ? (
          <div className="w-full max-w-md">
            <WishCard
              key={wish.id}
              emoji={wish.emoji}
              title={`For ${wish.name} · ${wish.tone}`}
              message={wish.text}
              accent="#ffb347"
            />
            <div className="mt-4 flex gap-3">
              <button data-ui type="button" onClick={copy} className="btn-ghost flex-1 rounded-xl py-2.5 text-sm">
                {copied ? "Copied ✓" : "📋 Copy wish"}
              </button>
              <button data-ui type="button" onClick={onCelebrate} className="btn-gold flex-1 rounded-xl py-2.5 text-sm">
                🎆 Send with fireworks
              </button>
            </div>
          </div>
        ) : (
          <div className="glass flex h-72 w-full max-w-md items-center justify-center rounded-3xl p-8 text-center text-amber-100/60">
            Your personalised Diwali wish will appear here 🪔
          </div>
        )}
      </div>
    </section>
  );
}
