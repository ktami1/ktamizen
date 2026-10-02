"use client";

// The animation libraries load after first paint so they stay out of the
// first load budget. Every component awaits loadGsap() before animating.

type Gsap = typeof import("gsap").gsap;
type ST = typeof import("gsap/ScrollTrigger").ScrollTrigger;
type Split = typeof import("gsap/SplitText").SplitText;
export type Motion = { gsap: Gsap; ScrollTrigger: ST; SplitText: Split };

// The one easing of the site: cubic-bezier(0.22, 1, 0.36, 1)
export const EASE = "ktz";
export const EASE_CSS = "cubic-bezier(0.22, 1, 0.36, 1)";

let promise: Promise<Motion> | null = null;

export function loadGsap(): Promise<Motion> {
  if (!promise) {
    promise = Promise.all([
      import("gsap"),
      import("gsap/ScrollTrigger"),
      import("gsap/SplitText"),
      import("gsap/CustomEase"),
    ]).then(([g, st, sp, ce]) => {
      const gsap = g.gsap;
      gsap.registerPlugin(st.ScrollTrigger, sp.SplitText, ce.CustomEase);
      ce.CustomEase.create(EASE, "0.22,1,0.36,1");
      st.ScrollTrigger.config({ ignoreMobileResize: true });
      gsap.defaults({ ease: EASE });
      document.documentElement.classList.add("gs");
      return { gsap, ScrollTrigger: st.ScrollTrigger, SplitText: sp.SplitText };
    });
  }
  return promise;
}

// Runs setup once the libraries are in, and cleans up whatever it returned.
export function withGsap(setup: (m: Motion) => void | (() => void)) {
  let dead = false;
  let cleanup: void | (() => void);
  loadGsap().then((m) => {
    if (!dead) cleanup = setup(m);
  });
  return () => {
    dead = true;
    if (cleanup) cleanup();
  };
}

export function motionAllowed() {
  if (typeof document === "undefined") return false;
  return document.documentElement.classList.contains("motion");
}

export function isFinePointer() {
  return typeof window !== "undefined" && window.matchMedia("(hover: hover) and (pointer: fine)").matches;
}

export function isLowEnd() {
  if (typeof navigator === "undefined") return true;
  const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
  const cores = nav.hardwareConcurrency ?? 4;
  const mem = nav.deviceMemory ?? 4;
  return cores < 4 || mem < 3 || nav.connection?.saveData === true;
}

export function debugMarkers() {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).has("debug");
}
