"use client";

import { useEffect, useRef, useState } from "react";
import { withGsap } from "@/lib/motion";

const WORD = "KTAMIZEN";

// About 1.2s, first visit only. Letters cut in, a red line sweeps under,
// then the screen wipes upward. Rendered by CSS only when JS and motion are on.
export default function Preloader() {
  const root = useRef<HTMLDivElement>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const html = document.documentElement;
    if (html.classList.contains("seen") || !html.classList.contains("motion")) {
      setDone(true);
      return;
    }
    return withGsap(({ gsap }) => {
      const el = root.current!;
      const letters = el.querySelectorAll<HTMLElement>("[data-l]");
      const line = el.querySelector<HTMLElement>("[data-line]");
      html.style.overflow = "hidden";

      const tl = gsap.timeline({
        onComplete: () => {
          try {
            sessionStorage.setItem("ktz-seen", "1");
          } catch {}
          html.style.overflow = "";
          html.classList.add("seen");
          window.dispatchEvent(new Event("ktz:ready"));
          setDone(true);
        },
      });
      // Hard cuts: each letter appears with no fade.
      tl.set(letters, { visibility: "visible", stagger: 0.07 }, 0.1)
        .fromTo(line, { scaleX: 0 }, { scaleX: 1, duration: 0.55 }, 0.45)
        .to(el, { clipPath: "inset(0 0 100% 0)", duration: 0.75, ease: "power4.inOut" }, 1.0);

      // If everything is already there, do not make anyone wait longer.
      const fonts = document.fonts?.ready;
      fonts?.then(() => {
        if (tl.time() < 0.75) tl.timeScale(1.25);
      });
      window.dispatchEvent(new Event("ktz:preloading"));

      return () => {
        tl.kill();
        html.style.overflow = "";
      };
    });
  }, []);

  if (done) return null;

  return (
    <div
      ref={root}
      className="preloader fixed inset-0 z-[90] items-center justify-center bg-ink"
      style={{ clipPath: "inset(0 0 0% 0)" }}
      aria-hidden="true"
    >
      <div className="relative">
        <div className="serif text-paper" style={{ fontSize: "clamp(3rem, 12vw, 9rem)" }}>
          {WORD.split("").map((c, i) => (
            <span key={i} data-l style={{ visibility: "hidden" }}>
              {c}
            </span>
          ))}
        </div>
        <div
          data-line
          className="absolute -bottom-2 left-0 h-[2px] w-full origin-left bg-red"
          style={{ transform: "scaleX(0)" }}
        />
      </div>
    </div>
  );
}
