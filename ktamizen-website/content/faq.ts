import { site } from "@/config/site";

export type Faq = {
  id: string;
  category: `story` | `brand` | `faith` | `shop` | `work`;
  question: string;
  aliases: string[];
  answer: string;
  status: `approved` | `draft` | `todo`;
};

export const faqs: Faq[] = [
  {
    id: `how-lines`,
    category: `story`,
    question: `how do you come up with these lines?`,
    aliases: [`how do you brainstorm`, `where do the quotes come from`, `do you write them yourself`, `inspiration`, `ideas`],
    answer: `honestly i trained my algorithm to only show me growth. seeing positive stuff all day keeps me inspired. sometimes it's a line in a song, a book, my faith, or just a thought i had at 2am. i take it and make it mine.`,
    status: `approved`,
  },
  {
    id: `why`,
    category: `story`,
    question: `why do you do this?`,
    aliases: [`why did you start`, `motivation`, `what keeps you going`, `purpose`],
    answer: `honestly i just write what i needed to hear when nobody said it to me. pages like this got me through my hardest years. now that things are better, i'm giving it back. so many of you text me that one line changed your day. that's enough for me. that's what keeps me going.`,
    status: `approved`,
  },
  {
    id: `secret`,
    category: `story`,
    question: `what is the secret behind all of this?`,
    aliases: [`secret`, `how did you grow`, `how did you get 340k`, `growth`, `success`, `tips`],
    answer: `i just post what i feel. then i ask myself: if someone having a bad day reads this, would it help them even a little? that's the whole secret. you gotta be human so other humans can feel you.`,
    status: `approved`,
  },
  {
    id: `name`,
    category: `brand`,
    question: `what does KTAMIZEN mean?`,
    aliases: [`name meaning`, `ktami`, `zen`, `how do you pronounce it`, `why that name`],
    answer: `KTAMI (my name) + ZEN (inner peace). the state of mind i want us to reach. it's personal, that's why it carries my name.`,
    status: `approved`,
  },
  {
    id: `favorite-note`,
    category: `story`,
    question: `what is your favorite note of all time?`,
    aliases: [`favorite quote`, `favorite line`, `best post`],
    answer: `God with me, i can't lose.`,
    status: `approved`,
  },
  {
    id: `digital-products`,
    category: `shop`,
    question: `how do digital products work?`,
    aliases: [`download`, `wallpaper`, `pdf`, `how to download`, `refund`, `license`, `personal use`, `commercial use`],
    answer: `you buy, you get an instant download link. it's for personal use only. need help? message @ktamizen on instagram or x. no refunds on digital products, except if i made a mistake.`,
    status: `approved`,
  },
  {
    id: `who`,
    category: `brand`,
    question: `who is behind KTAMIZEN?`,
    aliases: [`who are you`, `who runs this page`, `founder`, `team`, `agency`, `owner`, `one person`],
    answer: `one person. i'm the founder. no team, no agency. i build this at night, after my 9 to 5.`,
    status: `draft`,
  },
  {
    id: `how-long`,
    category: `story`,
    question: `how long have you been doing this?`,
    aliases: [`since when`, `started`, `years`, `consistency`],
    answer: `2.5 years. 100+ weeks in a row, even when nobody was watching.`,
    status: `draft`,
  },
  {
    id: `regret`,
    category: `story`,
    question: `what is your biggest regret?`,
    aliases: [`regret`, `mistake`, `what would you change`],
    answer: `letting fear decide for me for too long. either the fear goes away or the opportunity does.`,
    status: `draft`,
  },
  {
    id: `atheist`,
    category: `faith`,
    question: `what would you say to someone who doesn't believe in God?`,
    aliases: [`atheist`, `non believer`, `not religious`, `religion`, `faith`, `God`],
    answer: `you don't have to believe what i believe to take what helps you. discipline, peace, boundaries work for everyone. take what hits, leave the rest.`,
    status: `draft`,
  },
  {
    id: `billionaire`,
    category: `brand`,
    question: `are you a billionaire?`,
    aliases: [`rich`, `net worth`, `how rich are you`, `money`],
    answer: `not yet. ask me again in a few years.`,
    status: `draft`,
  },
  {
    id: `shop-when`,
    category: `shop`,
    question: `when does the shop open?`,
    aliases: [`shop`, `store`, `merch`, `where can i buy`, `drop`, `link in bio`],
    answer: `soon. join the list and you hear first.`,
    status: `draft`,
  },
  {
    id: `what-sell`,
    category: `shop`,
    question: `what are you selling?`,
    aliases: [`products`, `posters`, `wallpapers`, `t shirt`, `hoodie`, `digital`],
    answer: `posters first, in 30x40, 50x70 and 70x100 cm. digital packs too, like wallpapers. all in the KTAMIZEN style.`,
    status: `draft`,
  },
  {
    id: `collab`,
    category: `work`,
    question: `can we work together?`,
    aliases: [`collab`, `sponsor`, `paid post`, `advertise`, `partnership`, `business`, `brand deal`, `shoutout`, `promotion`],
    answer: `yes. email me with what you have in mind. the page reaches 340k+ followers and roughly 16M+ views a month.`,
    status: `draft`,
  },
  {
    id: `contact`,
    category: `work`,
    question: `how can i reach you?`,
    aliases: [`contact`, `dm`, `email`, `support`, `message you`],
    answer: `dm @ktamizen on instagram. for business, use the email at the bottom of this page.`,
    status: `draft`,
  },
  { id: `face`, category: `brand`, question: `will you ever show your face?`, aliases: [`face reveal`, `show your face`, `what do you look like`, `photo`], answer: ``, status: `todo` },
  { id: `money`, category: `brand`, question: `how do you make money from the page?`, aliases: [`monetize`, `income`, `earn`], answer: ``, status: `todo` },
  { id: `shipping`, category: `shop`, question: `where do you ship posters?`, aliases: [`shipping`, `delivery`, `international`, `how long`, `tracking`, `customs`], answer: ``, status: `todo` },
  { id: `repost`, category: `work`, question: `can i repost your posts?`, aliases: [`repost`, `share your quotes`, `use your quotes`, `credit`], answer: ``, status: `todo` },
];

export const categoryLabels: Record<Faq["category"], string> = {
  story: "story",
  brand: "brand",
  faith: "faith",
  shop: "shop",
  work: "work",
};

// The shop-when answer follows the shop state.
function resolve(faq: Faq): Faq {
  if (faq.id === "shop-when" && site.shopState === "live") {
    return { ...faq, answer: `it's open. ${site.shopUrl.replace(/^https?:\/\//, "")}` };
  }
  return faq;
}

// Approved entries, plus drafts when showDrafts is on. Never empty answers.
export function visibleFaqs(): Faq[] {
  return faqs
    .filter((f) => f.answer.trim().length > 0)
    .filter((f) => f.status === "approved" || (site.showDrafts && f.status === "draft"))
    .map(resolve);
}
