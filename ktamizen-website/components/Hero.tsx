"use client";

import { useEffect, useRef } from "react";
import DitherHero from "./DitherHero";
import MagneticButton from "./MagneticButton";
import { shopCta } from "@/config/site";
import { debugMarkers, withGsap, motionAllowed } from "@/lib/motion";

const reveal = { opacity: 0, y: 16, filter: "blur(8px)" };
const shown = { opacity: 1, y: 0, filter: "blur(0px)" };

export default function Hero() {
  const root = useRef<HTMLElement>(null);
  const progress = useRef(0);
  const cta = shopCta();

  useEffect(() => {
    if (!motionAllowed()) return;
    return withGsap(({ gsap, ScrollTrigger, SplitText }) => {
      const el = root.current!;

      const ctx = gsap.context(() => {
        const mark = new SplitText(el.querySelector("[data-mark]"), { type: "chars" });
        const lineA = new SplitText(el.querySelector("[data-line-a]"), { type: "words" });
        const lineB = new SplitText(el.querySelector("[data-line-b]"), { type: "words" });
        gsap.set("[data-reveal]", { opacity: 1 });
        gsap.set([...lineA.words, ...lineB.words], reveal);
        gsap.set("[data-end]", { ...reveal });
        gsap.set(mark.chars, reveal);

        // Intro: the wordmark resolves as soon as the preloader leaves.
        const intro = () => gsap.to(mark.chars, { ...shown, duration: 0.9, stagger: 0.045, delay: 0.05 });
        if (document.documentElement.classList.contains("seen")) intro();
        else window.addEventListener("ktz:ready", intro, { once: true });

        gsap.fromTo("[data-cue]", { opacity: 0 }, { opacity: 1, duration: 0.8, delay: 1.4 });

        // Scroll: lines arrive one after the other, then the buttons.
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: el,
            start: "top top",
            end: "bottom bottom",
            scrub: 0.6,
            markers: debugMarkers(),
            onUpdate: (self) => (progress.current = self.progress),
          },
          defaults: { ease: "none" },
        });
        tl.to(lineA.words, { ...shown, stagger: 0.06, duration: 0.18 }, 0.08)
          .to(lineB.words, { ...shown, stagger: 0.06, duration: 0.18 }, 0.32)
          .to("[data-end]", { ...shown, stagger: 0.05, duration: 0.16 }, 0.56)
          .to("[data-cue]", { opacity: 0, duration: 0.1 }, 0.5)
          .to({}, { duration: 0.1 }, 0.9);

        ScrollTrigger.refresh();
      }, el);

      return () => ctx.revert();
    });
  }, []);

  return (
    <section ref={root} id="top" className="hero-pin relative bg-ink" aria-label="KTAMIZEN">
      <div className="hero-sticky relative flex min-h-svh flex-col overflow-hidden">
        {/* Soft red glow: the one gradient of the page, visible until the canvas paints. */}
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{ background: "radial-gradient(60% 45% at 50% 62%, rgba(211,0,0,0.38), rgba(211,0,0,0) 70%)" }}
        />
        <div className="absolute inset-0">
          <DitherHero progress={progress} />
        </div>

        <header className="gutter relative z-10 flex items-center justify-between pt-6">
          <a href="#top" className="serif text-[28px] leading-none" aria-label="KTAMIZEN, back to top">
            K
          </a>
          <a href="#ask" className="caption link-line">
            Ask the founder
          </a>
        </header>

        <div data-stack className="gutter relative z-10 flex min-h-0 flex-1 flex-col justify-center py-8">
          <p data-line-a data-reveal className="serif text-h1" style={{ lineHeight: 0.95 }}>
            KTAMI <span className="text-paper md:text-red">+</span> ZEN.
          </p>
          <p
            data-line-b
            data-reveal
            className="mt-3 text-h2 uppercase"
            style={{ letterSpacing: "var(--track-sans)", lineHeight: 1 }}
          >
            Powered by God.
          </p>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row md:mt-12">
            <div data-end data-reveal>
              <MagneticButton href="#ask" variant="primary" className="w-full sm:w-auto">
                Ask the founder
              </MagneticButton>
            </div>
            <div data-end data-reveal>
              <MagneticButton
                href={cta.href}
                variant="ghost"
                className="w-full sm:w-auto"
                external={cta.kind === "shop"}
              >
                {cta.label}
              </MagneticButton>
            </div>
          </div>
        </div>

        <div className="gutter relative z-10 flex items-end justify-between pb-4">
          <p data-end data-reveal className="caption text-paper">
            no face, just the words.
          </p>
          <div data-cue className="flex flex-col items-center gap-2" aria-hidden="true">
            <span className="caption text-mute">scroll</span>
            <span className="relative block h-10 w-px overflow-hidden bg-hair">
              <span className="cue-dot absolute left-0 top-0 block h-4 w-px bg-red" />
            </span>
          </div>
        </div>

        <h1
          data-mark
          data-reveal
          className="serif relative z-10 whitespace-nowrap text-center"
          style={{
            fontSize: "clamp(3.5rem, min(26.5vw, 34svh), 34rem)",
            lineHeight: 0.78,
            paddingBottom: "0.04em",
            letterSpacing: "-0.06em",
          }}
        >
          KTAMIZEN
        </h1>
      </div>
    </section>
  );
}
