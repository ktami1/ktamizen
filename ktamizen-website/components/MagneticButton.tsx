"use client";

import { useEffect, useRef } from "react";
import { withGsap, isFinePointer, motionAllowed } from "@/lib/motion";

type Props = {
  href?: string;
  onClick?: () => void;
  variant?: "primary" | "ghost" | "white";
  children: React.ReactNode;
  className?: string;
  type?: "button" | "submit";
  external?: boolean;
  ariaLabel?: string;
};

// Small pull toward the cursor, 1.02 scale on hover, instant color swap.
export default function MagneticButton({
  href,
  onClick,
  variant = "primary",
  children,
  className = "",
  type = "button",
  external,
  ariaLabel,
}: Props) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!isFinePointer() || !motionAllowed()) return;
    return withGsap(({ gsap }) => {
      const el = ref.current!;
      const xTo = gsap.quickTo(el, "x", { duration: 0.4 });
      const yTo = gsap.quickTo(el, "y", { duration: 0.4 });
      const onMove = (e: PointerEvent) => {
        const r = el.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        xTo(Math.max(-8, Math.min(8, dx * 0.15)));
        yTo(Math.max(-8, Math.min(8, dy * 0.25)));
      };
      const onEnter = () => gsap.to(el, { scale: 1.02, duration: 0.4 });
      const onLeave = () => {
        xTo(0);
        yTo(0);
        gsap.to(el, { scale: 1, duration: 0.4 });
      };
      el.addEventListener("pointermove", onMove);
      el.addEventListener("pointerenter", onEnter);
      el.addEventListener("pointerleave", onLeave);
      return () => {
        el.removeEventListener("pointermove", onMove);
        el.removeEventListener("pointerenter", onEnter);
        el.removeEventListener("pointerleave", onLeave);
      };
    });
  }, []);

  const cls = `btn btn-${variant} ${className}`;
  const inner = (
    <>
      <span>{children}</span>
      <span className="arrow" aria-hidden="true">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M1 7h11M7.5 2.5 12 7l-4.5 4.5" stroke="currentColor" strokeWidth="1.6" />
        </svg>
      </span>
    </>
  );

  if (href) {
    return (
      <a
        ref={ref as React.RefObject<HTMLAnchorElement>}
        href={href}
        className={cls}
        onClick={onClick}
        aria-label={ariaLabel}
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      >
        {inner}
      </a>
    );
  }
  return (
    <button
      ref={ref as React.RefObject<HTMLButtonElement>}
      type={type}
      className={cls}
      onClick={onClick}
      aria-label={ariaLabel}
    >
      {inner}
    </button>
  );
}
