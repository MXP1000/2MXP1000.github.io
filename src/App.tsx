import { useEffect, useRef, useState } from "react";
import ThreeStage from "./components/ThreeStage";
import Toolbar from "./components/Toolbar";
import Hero from "./components/Hero";
import WishComposer from "./components/WishComposer";
import WishGallery from "./components/WishGallery";
import CursorTrail from "./components/CursorTrail";
import type { DiwaliScene } from "./three/DiwaliScene";
import * as sfx from "./audio/sfx";

export default function App() {
  const sceneRef = useRef<DiwaliScene | null>(null);
  const [muted, setMuted] = useState(false);
  const [lit, setLit] = useState(false);
  const [flashKey, setFlashKey] = useState(0);

  const show = () => {
    sfx.unlock();
    sceneRef.current?.startShow(12);
  };
  const celebrate = () => {
    sfx.unlock();
    sceneRef.current?.startShow(6);
  };
  const bomb = () => {
    sfx.unlock();
    sceneRef.current?.bombRandom();
  };
  const toggleDiyas = () => {
    sfx.unlock();
    setLit(sceneRef.current?.lightDiyas() ?? false);
  };
  const toggleMute = () => {
    const next = !muted;
    sfx.setMuted(next);
    setMuted(next);
  };

  // Keyboard shortcuts (kept in a ref so the listener is registered once)
  const handlers = useRef({ show, bomb, toggleDiyas, toggleMute });
  handlers.current = { show, bomb, toggleDiyas, toggleMute };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      switch (e.key.toLowerCase()) {
        case "f":
          handlers.current.show();
          break;
        case "b":
          handlers.current.bomb();
          break;
        case "d":
          handlers.current.toggleDiyas();
          break;
        case "m":
          handlers.current.toggleMute();
          break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="relative min-h-screen overflow-x-hidden text-amber-50">
      <ThreeStage onReady={(s) => (sceneRef.current = s)} onBoom={() => setFlashKey((k) => k + 1)} />
      <div className="vignette pointer-events-none fixed inset-0 z-10" />
      <CursorTrail />

      <Toolbar
        muted={muted}
        lit={lit}
        onToggleMute={toggleMute}
        onToggleDiyas={toggleDiyas}
        onShow={show}
        onBomb={bomb}
      />

      <main className="pointer-events-none relative z-20">
        <section className="flex min-h-screen items-center justify-center px-6 pt-20">
          <Hero onShow={show} />
        </section>

        <WishComposer onCelebrate={celebrate} />
        <WishGallery onCelebrate={celebrate} />

        <footer className="relative z-20 pb-10 text-center text-sm text-amber-100/60">
          Made with ✨ &amp; light · Shubh Deepavali 2026
        </footer>
      </main>

      {flashKey > 0 && <div key={flashKey} className="flash-overlay" />}
    </div>
  );
}
