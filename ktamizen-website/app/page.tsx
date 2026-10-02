import Experience from "@/components/Experience";
import Preloader from "@/components/Preloader";
import Cursor from "@/components/Cursor";
import Grain from "@/components/Grain";
import Hero from "@/components/Hero";
import OversizedLine from "@/components/OversizedLine";
import Numbers from "@/components/Numbers";
import Story from "@/components/Story";
import Messages from "@/components/Messages";
import AskTheFounder from "@/components/AskTheFounder";
import FaqAccordion from "@/components/FaqAccordion";
import Coming from "@/components/Coming";
import ForBrands from "@/components/ForBrands";
import Footer from "@/components/Footer";
import { visibleFaqs } from "@/content/faq";

export default function Page() {
  const faqs = visibleFaqs();
  return (
    <>
      <Experience />
      <Preloader />
      <Cursor />
      <Grain />
      <a
        href="#ask"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:bg-paper focus:p-3 focus:text-ink"
      >
        Skip to Ask the founder
      </a>
      <main>
        <Hero />
        <OversizedLine text="Powered by God" />
        <Numbers />
        <Story />
        <Messages />
        <AskTheFounder faqs={faqs} />
        <FaqAccordion faqs={faqs} />
        <Coming />
        <ForBrands />
      </main>
      <Footer />
    </>
  );
}
