"use client";

import { useEffect } from "react";
import type Lenis from "lenis";
import { withGsap, isFinePointer, motionAllowed } from "@/lib/motion";

// Global layer: smooth scroll on desktop, synced to ScrollTrigger, plus the
// scroll velocity value other components read.
export const scrollState = { velocity: 0, lenis: null as Lenis | null };

export default function Experience() {
  useEffect(() => {
    if (!motionAllowed()) return;
    let LenisCtor: typeof Lenis | null = null;
    const ready = isFinePointer() ? import("lenis").then((m) => (LenisCtor = m.default)) : Promise.resolve();
    let dispose: (() => void) | undefined;
    let dead = false;
    ready.then(() => {
      if (dead) return;
      dispose = withGsap(({ gsap, ScrollTrigger }) => {
        let lenis: Lenis | null = null;
        let tick: ((time: number) => void) | null = null;

        // Touch devices and in app browsers keep native scroll: more reliable.
        if (LenisCtor) {
          lenis = new LenisCtor({ duration: 1.15, easing: (t) => 1 - Math.pow(1 - t, 4), smoothWheel: true });
          scrollState.lenis = lenis;
          lenis.on("scroll", (e: Lenis) => {
            scrollState.velocity = e.velocity;
            ScrollTrigger.update();
          });
          tick = (time: number) => lenis!.raf(time * 1000);
          gsap.ticker.add(tick);
          gsap.ticker.lagSmoothing(0);
        } else {
          let last = window.scrollY;
          let lastT = performance.now();
          tick = () => {
            const now = performance.now();
            const y = window.scrollY;
            const dt = Math.max(1, now - lastT);
            scrollState.velocity = ((y - last) / dt) * 16;
            last = y;
            lastT = now;
          };
          gsap.ticker.add(tick);
        }

        // Anchor links go through Lenis so they glide instead of jumping.
        const onClick = (e: MouseEvent) => {
          const a = (e.target as HTMLElement).closest("a[href^='#']") as HTMLAnchorElement | null;
          if (!a) return;
          const id = a.getAttribute("href")!.slice(1);
          const el = id ? document.getElementById(id) : null;
          if (!el) return;
          e.preventDefault();
          scrollTo(el);
          history.replaceState(null, "", `#${id}`);
        };
        document.addEventListener("click", onClick);

        const onLoad = () => ScrollTrigger.refresh();
        window.addEventListener("load", onLoad);
        document.fonts?.ready.then(() => ScrollTrigger.refresh());

        return () => {
          document.removeEventListener("click", onClick);
          window.removeEventListener("load", onLoad);
          if (tick) gsap.ticker.remove(tick);
          lenis?.destroy();
          scrollState.lenis = null;
        };
      });
    });
    return () => {
      dead = true;
      dispose?.();
    };
  }, []);

  return null;
}

export function scrollTo(el: HTMLElement) {
  if (scrollState.lenis) {
    scrollState.lenis.scrollTo(el, { duration: 1.6 });
  } else {
    const reduce = !motionAllowed();
    el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  }
}
