import WishCard from "./WishCard";
import { PRESETS } from "../data/wishes";

interface WishGalleryProps {
  onCelebrate: () => void;
}

export default function WishGallery({ onCelebrate }: WishGalleryProps) {
  return (
    <section id="gallery" className="relative z-20 mx-auto max-w-6xl px-6 pb-24">
      <div className="mb-12 text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-amber-300/80">Gallery</p>
        <h2 className="text-gold font-display mt-2 text-3xl md:text-5xl">Wishes to Share</h2>
        <p className="mt-3 text-amber-100/70">Tap any card to light up the sky ✨</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {PRESETS.map((p) => (
          <WishCard
            key={p.title}
            emoji={p.emoji}
            title={p.title}
            message={p.text}
            accent={p.accent}
            onClick={onCelebrate}
            footer={
              <span className="pointer-events-none mt-5 inline-block text-xs uppercase tracking-widest text-amber-200/70">
                Tap to celebrate →
              </span>
            }
          />
        ))}
      </div>
    </section>
  );
}
