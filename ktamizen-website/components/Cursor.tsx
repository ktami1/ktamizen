"use client";

import { useEffect, useRef } from "react";
import { withGsap, isFinePointer } from "@/lib/motion";

// Desktop only. A white dot that becomes a red ring on interactive elements,
// with the label ASK over the Ask the founder section.
export default function Cursor() {
  const root = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!isFinePointer()) return;
    return withGsap(({ gsap }) => {
      const html = document.documentElement;
      html.classList.add("has-cursor");
      const el = root.current!;
      const xTo = gsap.quickTo(el, "x", { duration: 0.35, ease: "power3" });
      const yTo = gsap.quickTo(el, "y", { duration: 0.35, ease: "power3" });
      let shown = false;

      const setState = (state: "dot" | "ring" | "ask") => {
        if (el.dataset.state === state) return;
        el.dataset.state = state;
        const big = state !== "dot";
        gsap.to(ring.current, {
          width: state === "ask" ? 88 : big ? 48 : 10,
          height: state === "ask" ? 88 : big ? 48 : 10,
          backgroundColor: big ? "rgba(211,0,0,0)" : "#ffffff",
          borderColor: big ? "#d30000" : "#ffffff",
          duration: 0.4,
        });
        gsap.to(label.current, { opacity: state === "ask" ? 1 : 0, duration: 0.25 });
      };

      const onMove = (e: PointerEvent) => {
        if (!shown) {
          gsap.set(el, { x: e.clientX, y: e.clientY });
          gsap.to(el, { opacity: 1, duration: 0.3 });
          shown = true;
        }
        xTo(e.clientX);
        yTo(e.clientY);
        const t = e.target as HTMLElement;
        const interactive = t.closest("a, button, summary, input, textarea, [data-cursor]");
        if (interactive) setState("ring");
        else if (t.closest("[data-cursor-ask]")) setState("ask");
        else setState("dot");
      };
      const onLeave = () => {
        gsap.to(el, { opacity: 0, duration: 0.3 });
        shown = false;
      };
      window.addEventListener("pointermove", onMove, { passive: true });
      document.addEventListener("pointerleave", onLeave);
      return () => {
        html.classList.remove("has-cursor");
        window.removeEventListener("pointermove", onMove);
        document.removeEventListener("pointerleave", onLeave);
      };
    });
  }, []);

  return (
    <div ref={root} className="cursor" style={{ opacity: 0 }} aria-hidden="true" data-state="dot">
      <div
        ref={ring}
        className="absolute left-0 top-0 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border"
        style={{ width: 10, height: 10, background: "#fff", borderColor: "#fff" }}
      >
        <span ref={label} className="caption text-paper" style={{ opacity: 0, letterSpacing: "0.12em" }}>
          Ask
        </span>
      </div>
    </div>
  );
}
