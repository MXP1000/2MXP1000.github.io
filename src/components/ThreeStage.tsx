import { useEffect, useRef } from "react";
import { DiwaliScene } from "../three/DiwaliScene";

interface ThreeStageProps {
  onReady: (scene: DiwaliScene | null) => void;
  onBoom: () => void;
}

/** Full-screen fixed container that hosts the three.js diwali scene. */
export default function ThreeStage({ onReady, onBoom }: ThreeStageProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const callbacks = useRef({ onReady, onBoom });
  callbacks.current = { onReady, onBoom };

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const scene = new DiwaliScene(host, {
      onBoom: () => callbacks.current.onBoom(),
    });
    callbacks.current.onReady(scene);
    return () => {
      callbacks.current.onReady(null);
      scene.dispose();
    };
  }, []);

  return <div ref={hostRef} aria-hidden="true" className="fixed inset-0 z-0 overflow-hidden" />;
}
