import { useEffect } from "react";

/** Golden glitter that follows the mouse cursor. */
export default function CursorTrail() {
  useEffect(() => {
    let last = 0;
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      const now = performance.now();
      if (now - last < 32) return;
      last = now;
      const dot = document.createElement("span");
      dot.className = "trail-dot";
      dot.style.left = `${e.clientX}px`;
      dot.style.top = `${e.clientY}px`;
      dot.style.setProperty("--dx", `${(Math.random() - 0.5) * 36}px`);
      dot.style.setProperty("--dy", `${(Math.random() - 0.5) * 36}px`);
      document.body.appendChild(dot);
      window.setTimeout(() => dot.remove(), 800);
    };
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  return null;
}
