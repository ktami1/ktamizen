// Each chapter is one pinned screen. `accent` is the single word styled per chapter.

export type Chapter = {
  text: string;
  accent: string;
  style: "red" | "italic";
};

export const chapters: Chapter[] = [
  {
    text: "i spent years scrolling pages like this one. they got me through my hardest years.",
    accent: "hardest",
    style: "red",
  },
  {
    text: "now things are better. so i'm giving it back.",
    accent: "back.",
    style: "italic",
  },
  {
    text: "no face. no shortcuts. 100+ weeks in a row, even when nobody was watching.",
    accent: "nobody",
    style: "red",
  },
  {
    text: "the 9 to 5 pays the bills. the 5 to 9 builds this. no rush. God's timing.",
    accent: "timing.",
    style: "italic",
  },
  {
    text: "KTAMI + ZEN. that's the name. that's the whole idea.",
    accent: "whole",
    style: "italic",
  },
];
