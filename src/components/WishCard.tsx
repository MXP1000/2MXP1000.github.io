import { useRef } from "react";
import type { PointerEvent as ReactPointerEvent, ReactNode } from "react";

interface WishCardProps {
  emoji?: string;
  title: string;
  message: string;
  accent?: string;
  onClick?: () => void;
  footer?: ReactNode;
  className?: string;
}

/** Glass card that tilts in 3D toward the pointer and shows a light glare. */
export default function WishCard({
  emoji,
  title,
  message,
  accent = "#ffb347",
  onClick,
  footer,
  className = "",
}: WishCardProps) {
  const ref = useRef<HTMLDivElement>(null);

  const onMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    el.style.transform = `perspective(900px) rotateX(${(0.5 - py) * 14}deg) rotateY(${(px - 0.5) * 14}deg) scale(1.02)`;
    el.style.setProperty("--mx", `${px * 100}%`);
    el.style.setProperty("--my", `${py * 100}%`);
  };

  const onLeave = () => {
    const el = ref.current;
    if (el) el.style.transform = "perspective(900px) rotateX(0deg) rotateY(0deg) scale(1)";
  };

  return (
    <div
      ref={ref}
      data-ui
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      onClick={onClick}
      className={`glass tilt relative overflow-hidden rounded-3xl p-6 transition-transform duration-200 ease-out ${
        onClick ? "cursor-pointer" : ""
      } ${className}`}
      style={{ boxShadow: `0 25px 70px -25px ${accent}`, transformStyle: "preserve-3d" }}
    >
      <div className="glare" />
      <div className="pointer-events-none" style={{ transform: "translateZ(30px)" }}>
        {emoji && <div className="text-4xl drop-shadow-[0_0_12px_rgba(255,190,90,0.7)]">{emoji}</div>}
        <h3 className="font-display mt-3 text-xl text-amber-100">{title}</h3>
        <p className="mt-2 leading-relaxed text-amber-50/85">{message}</p>
      </div>
      {footer}
    </div>
  );
}
