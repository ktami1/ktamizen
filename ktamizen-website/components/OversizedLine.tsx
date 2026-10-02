"use client";

import { useEffect, useRef } from "react";
import { scrollState } from "./Experience";
import { debugMarkers, withGsap, motionAllowed } from "@/lib/motion";

// One line wider than the viewport. It drifts with scroll and speeds up with
// scroll velocity, then eases back. Used once on the page.
export default function OversizedLine({ text }: { text: string }) {
  const root = useRef<HTMLElement>(null);
  const line = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!motionAllowed()) return;
    return withGsap(({ gsap, ScrollTrigger }) => {
      const el = line.current!;
      let base = 0;
      let boost = 0;
      let x = 0;

      const st = ScrollTrigger.create({
        trigger: root.current,
        start: "top bottom",
        end: "bottom top",
        markers: debugMarkers(),
        onUpdate: (self) => (base = self.progress),
      });

      const tick = () => {
        const width = el.scrollWidth;
        const travel = width - window.innerWidth;
        const target = 0.08 * window.innerWidth - base * (travel + 0.16 * window.innerWidth);
        const v = Math.max(-60, Math.min(60, scrollState.velocity));
        boost += (v * 6 - boost) * 0.08;
        x += (target - boost - x) * 0.12;
        el.style.transform = `translate3d(${x.toFixed(2)}px,0,0)`;
        scrollState.velocity *= 0.9;
      };
      gsap.ticker.add(tick);
      return () => {
        st.kill();
        gsap.ticker.remove(tick);
      };
    });
  }, []);

  return (
    <section ref={root} aria-label={text} className="relative overflow-hidden bg-ink py-[12vh] md:py-[16vh]">
      <div
        ref={line}
        aria-hidden="true"
        className="whitespace-nowrap uppercase text-red will-change-transform"
        style={{
          fontSize: "clamp(6rem, 24vw, 26rem)",
          letterSpacing: "-0.055em",
          lineHeight: 0.8,
          marginLeft: "-4vw",
        }}
      >
        {text}
      </div>
    </section>
  );
}
