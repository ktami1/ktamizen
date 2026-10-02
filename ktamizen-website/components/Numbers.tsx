"use client";

import { useEffect, useRef } from "react";
import { site } from "@/config/site";
import { debugMarkers, withGsap, motionAllowed } from "@/lib/motion";

const items = [site.numbers.followers, site.numbers.views, site.numbers.weeks];

// The one inverted section. Figures render final on the server and count up
// once on enter, with the width reserved so nothing shifts.
export default function Numbers() {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!motionAllowed()) return;
    return withGsap(({ gsap }) => {
      const el = root.current!;
      const ctx = gsap.context(() => {
        gsap.fromTo(
          el,
          { clipPath: "inset(18% 0 0 0)" },
          {
            clipPath: "inset(0% 0 0 0)",
            ease: "none",
            scrollTrigger: { trigger: el, start: "top bottom", end: "top 40%", scrub: true, markers: debugMarkers() },
          },
        );

        const nums = el.querySelectorAll<HTMLElement>("[data-count]");
        nums.forEach((n) => (n.textContent = "0"));
        gsap.set("[data-num-row]", { opacity: 0, y: 24 });
        gsap.to("[data-num-row]", {
          opacity: 1,
          y: 0,
          duration: 0.9,
          stagger: 0.12,
          scrollTrigger: { trigger: el, start: "top 65%", once: true },
          onStart: () => {
            nums.forEach((n, i) => {
              const end = Number(n.dataset.count);
              const o = { v: 0 };
              gsap.to(o, {
                v: end,
                duration: 1.8,
                delay: i * 0.12,
                ease: "power3.out",
                onUpdate: () => (n.textContent = String(Math.round(o.v))),
              });
            });
          },
        });
      }, el);
      return () => ctx.revert();
    });
  }, []);

  return (
    <section ref={root} id="numbers" aria-labelledby="numbers-title" className="relative bg-paper text-ink">
      <div className="gutter mx-auto max-w-[1600px] py-[14vh] md:py-[18vh]">
        <h2 id="numbers-title" className="caption mb-14 md:mb-20">
          Built from zero, one week after another
        </h2>
        <ul className="grid gap-12 md:grid-cols-3 md:gap-0">
          {items.map((n, i) => (
            <li
              key={n.label}
              data-num-row
              className={`flex flex-col gap-4 md:px-8 ${i > 0 ? "md:border-l md:border-ink/15" : "md:pl-0"} border-t border-ink/15 pt-6 md:border-t-0 md:pt-0`}
            >
              <span className="serif text-display tabular-nums" style={{ lineHeight: 0.8 }}>
                <span className="relative inline-block">
                  <span className="invisible" aria-hidden="true">
                    {n.value}
                  </span>
                  <span data-count={n.value} className="absolute inset-0 text-right">
                    {n.value}
                  </span>
                </span>
                <span>{n.suffix}</span>
              </span>
              <span className="caption flex items-baseline gap-3">
                {n.label}
                {"note" in n && <span className="text-ink">({n.note})</span>}
              </span>
            </li>
          ))}
        </ul>
        <p className="caption mt-16 md:mt-24">
          <span className="mr-3 inline-block h-[2px] w-8 translate-y-[-3px] bg-red align-middle" aria-hidden="true" />
          zero faces.
        </p>
      </div>
    </section>
  );
}
