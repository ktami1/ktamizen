import { categoryLabels, type Faq } from "@/content/faq";

// Server rendered, works without JavaScript. Same data as Ask the founder.
export default function FaqAccordion({ faqs }: { faqs: Faq[] }) {
  const groups = (Object.keys(categoryLabels) as Faq["category"][])
    .map((c) => ({ c, items: faqs.filter((f) => f.category === c) }))
    .filter((g) => g.items.length);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };

  return (
    <section aria-labelledby="faq-title" className="faq gutter mx-auto w-full max-w-[1400px] bg-ink pb-[16vh]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <h2 id="faq-title" className="caption mb-10 text-mute">
        Everything answered so far
      </h2>
      <div className="flex flex-col gap-14">
        {groups.map((g) => (
          <div key={g.c} className="grid gap-4 md:grid-cols-[200px_1fr] md:gap-10">
            <h3 className="caption pt-5">{categoryLabels[g.c]}</h3>
            <div className="border-t border-hair">
              {g.items.map((f) => (
                <details key={f.id} id={`faq-${f.id}`} className="border-b border-hair">
                  <summary className="flex items-center justify-between gap-6 py-5 text-[17px] md:text-[19px]">
                    <span>{f.question}</span>
                    <span className="plus relative block h-4 w-4 shrink-0" aria-hidden="true">
                      <span className="absolute left-0 top-1/2 h-px w-4 bg-red" />
                      <span className="absolute left-1/2 top-0 h-4 w-px bg-red" />
                    </span>
                  </summary>
                  <p className="serif max-w-[40ch] pb-8 pr-8 text-[26px] md:text-[34px]" style={{ lineHeight: 1.12 }}>
                    {f.answer}
                  </p>
                </details>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
