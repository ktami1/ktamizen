import MagneticButton from "./MagneticButton";
import { site } from "@/config/site";

export default function ForBrands() {
  const n = site.numbers;
  return (
    <section id="brands" aria-labelledby="brands-title" className="bg-ink">
      <div className="gutter mx-auto grid max-w-[1600px] gap-14 py-[16vh] md:grid-cols-[1.2fr_1fr] md:gap-20">
        <div>
          <p className="caption mb-8 text-mute">For brands</p>
          <h2 id="brands-title" className="serif text-h1" style={{ lineHeight: 0.95 }}>
            one page. no face.
            <br />
            <span className="text-red">real</span> reach.
          </h2>
        </div>
        <div className="flex flex-col justify-end gap-10">
          <p className="max-w-[44ch] text-[17px] md:text-[19px]" style={{ lineHeight: 1.45 }}>
            {n.followers.value}
            {n.followers.suffix} followers. roughly {n.views.value}
            {n.views.suffix} views a month. people who come for the words and stay for them. if your brand fits that,
            email me.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <MagneticButton href={`mailto:${site.email}`} variant="ghost">
              Email me
            </MagneticButton>
          </div>
          <div className="flex gap-8">
            <a href={site.collabstrUrl} target="_blank" rel="noopener noreferrer" className="caption link-line">
              Collabstr
            </a>
            <a href={site.instagramUrl} target="_blank" rel="noopener noreferrer" className="caption link-line">
              Instagram
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
