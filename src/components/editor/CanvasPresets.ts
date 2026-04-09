export type PresetCategory = {
  name: string;
  presets: { name: string; width: number; height: number }[];
};

export const CANVAS_PRESETS: PresetCategory[] = [
  {
    name: 'Social Media',
    presets: [
      { name: 'Instagram Post', width: 1080, height: 1080 },
      { name: 'Instagram Portrait', width: 1080, height: 1350 },
      { name: 'Instagram Story / Reels', width: 1080, height: 1920 },
      { name: 'Instagram Landscape', width: 1080, height: 566 },
      { name: 'Facebook Post', width: 1200, height: 630 },
      { name: 'Facebook Story', width: 1080, height: 1920 },
      { name: 'Facebook Cover', width: 1640, height: 624 },
      { name: 'Twitter/X Post', width: 1600, height: 900 },
      { name: 'Twitter/X Header', width: 1500, height: 500 },
      { name: 'LinkedIn Post', width: 1200, height: 627 },
      { name: 'LinkedIn Cover', width: 1584, height: 396 },
      { name: 'TikTok Video', width: 1080, height: 1920 },
      { name: 'YouTube Thumbnail', width: 1280, height: 720 },
      { name: 'YouTube Banner', width: 2560, height: 1440 },
      { name: 'Pinterest Pin', width: 1000, height: 1500 },
      { name: 'Threads Post', width: 1080, height: 1080 },
      { name: 'Snapchat', width: 1080, height: 1920 },
      { name: 'WhatsApp Status', width: 1080, height: 1920 },
      { name: 'BeReal', width: 1500, height: 2000 },
    ],
  },
  {
    name: 'Wallpapers',
    presets: [
      { name: 'iPhone 17 Pro', width: 1179, height: 2556 },
      { name: 'iPhone 17 Pro Max', width: 1290, height: 2796 },
      { name: 'iPhone 16', width: 1179, height: 2556 },
      { name: 'iPad Pro 13"', width: 2064, height: 2752 },
      { name: 'iPad Air', width: 1640, height: 2360 },
      { name: 'MacBook Pro 16"', width: 3456, height: 2234 },
      { name: 'MacBook Air 15"', width: 2880, height: 1864 },
      { name: 'Apple Watch Ultra 2', width: 410, height: 502 },
      { name: 'Apple TV', width: 1920, height: 1080 },
      { name: 'iMac 24"', width: 4480, height: 2520 },
      { name: 'Android Phone', width: 1080, height: 2400 },
      { name: 'Samsung Galaxy S25 Ultra', width: 1440, height: 3088 },
    ],
  },
  {
    name: 'Print',
    presets: [
      { name: 'A4 Portrait', width: 2480, height: 3508 },
      { name: 'A4 Landscape', width: 3508, height: 2480 },
      { name: 'A3', width: 3508, height: 4961 },
      { name: 'Business Card', width: 1050, height: 600 },
      { name: 'Poster A2', width: 4961, height: 7016 },
      { name: 'Flyer A5', width: 1748, height: 2480 },
    ],
  },
  {
    name: 'Presentations',
    presets: [
      { name: 'Slides 16:9', width: 1920, height: 1080 },
      { name: 'PowerPoint 4:3', width: 1024, height: 768 },
      { name: 'Keynote', width: 1920, height: 1080 },
    ],
  },
];
