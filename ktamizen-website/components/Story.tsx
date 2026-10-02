"use client";

import { useEffect, useRef } from "react";
import { chapters, type Chapter } from "@/content/story";
import { debugMarkers, withGsap, motionAllowed } from "@/lib/motion";

function ChapterText({ c }: { c: Chapter }) {
  const i = c.text.indexOf(c.accent);
  if (i < 0) return <>{c.text}</>;
  return (
    <>
      {c.text.slice(0, i)}
      <span className={c.style === "red" ? "text-red" : "italic"}>{c.accent}</span>
      {c.text.slice(i + c.accent.length)}
    </>
  );
}

// Five pinned screens. Every character starts at 15 percent and lights up as
// the scroll passes over it, like reading along with a voice.
export default function Story() {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!motionAllowed()) return;
    return withGsap(({ gsap, SplitText }) => {
      const el = root.current!;
      const ctx = gsap.context(() => {
        el.querySelectorAll<HTMLElement>("[data-chapter]").forEach((ch) => {
          const text = ch.querySelector<HTMLElement>("[data-scrub]")!;
          const split = new SplitText(text, { type: "words,chars", wordsClass: "inline-block whitespace-nowrap" });
          gsap.set(split.chars, { opacity: 0.15 });
          const tl = gsap.timeline({
            scrollTrigger: {
              trigger: ch,
              start: "top top",
              end: "bottom bottom",
              scrub: 0.4,
              markers: debugMarkers(),
            },
            defaults: { ease: "none" },
          });
          tl.fromTo(ch.querySelector("[data-index]"), { opacity: 0 }, { opacity: 1, duration: 0.08 }, 0)
            .to(split.chars, { opacity: 1, stagger: 0.7 / split.chars.length, duration: 0.05 }, 0.05)
            .to({}, { duration: 0.2 });
        });

        const sig = el.querySelector<HTMLElement>("[data-signature]");
        if (sig) {
          gsap.fromTo(
            sig,
            { clipPath: "inset(0 100% 0 0)" },
            {
              clipPath: "inset(0 0% 0 0)",
              duration: 1.6,
              ease: "power2.inOut",
              scrollTrigger: { trigger: sig, start: "top 75%", once: true },
            },
          );
          gsap.fromTo(
            "[data-sig-caption]",
            { opacity: 0, y: 12 },
            {
              opacity: 1,
              y: 0,
              duration: 0.8,
              delay: 1.1,
              scrollTrigger: { trigger: sig, start: "top 75%", once: true },
            },
          );
        }
      }, el);
      return () => ctx.revert();
    });
  }, []);

  return (
    <section ref={root} id="story" aria-labelledby="story-title" className="relative bg-ink">
      <h2 id="story-title" className="sr-only">
        The story
      </h2>
      {chapters.map((c, i) => (
        <article key={i} data-chapter className="chapter relative">
          <div className="chapter-sticky gutter flex min-h-svh flex-col justify-center py-[12vh]">
            <p data-index className="caption mb-8 flex items-center gap-4 text-mute md:mb-12">
              <span className="text-paper">{String(i + 1).padStart(2, "0")}</span>
              <span className="block h-px w-10 bg-hair" aria-hidden="true" />
              <span>{String(chapters.length).padStart(2, "0")}</span>
            </p>
            <p data-scrub className="serif max-w-[17ch] text-h1" style={{ lineHeight: 1 }}>
              <ChapterText c={c} />
            </p>
          </div>
        </article>
      ))}

      <div className="gutter flex min-h-[80svh] flex-col items-center justify-center pb-[16vh] pt-[8vh] text-center">
        <p
          data-signature
          className="font-script text-paper italic"
          style={{
            fontSize: "clamp(6rem, 3rem + 16vw, 16rem)",
            lineHeight: 1,
            letterSpacing: "-0.02em",
            paddingInline: "0.15em",
          }}
        >
          Ktami
        </p>
        <p data-sig-caption className="caption mt-4 text-mute">
          the founder
        </p>
      </div>
    </section>
  );
}
