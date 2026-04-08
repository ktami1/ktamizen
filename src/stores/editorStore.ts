import { create } from 'zustand';

export type FormatPreset = {
  name: string;
  width: number;
  height: number;
  ratio: string;
};

export const FORMAT_PRESETS: FormatPreset[] = [
  { name: 'Post (1:1)', width: 1080, height: 1080, ratio: '1:1' },
  { name: 'Portrait (4:5)', width: 1080, height: 1350, ratio: '4:5' },
  { name: 'Story (9:16)', width: 1080, height: 1920, ratio: '9:16' },
  { name: 'Landscape (16:9)', width: 1920, height: 1080, ratio: '16:9' },
  { name: 'iPhone Wallpaper', width: 1290, height: 2796, ratio: '~9:19.5' },
];

export type SlideData = {
  id: string;
  objects: string;
  thumbnail?: string;
};

export type HistoryEntry = {
  slides: SlideData[];
  activeSlideIndex: number;
};

export type EditorTool = 'select' | 'text' | 'shape' | 'image';

export type TextPreset = {
  id: string;
  name: string;
  category: 'title' | 'subtitle' | 'caption' | 'custom';
  fontFamily: string;
  fontSize: number;
  fontWeight: string;
  fill: string;
  charSpacing: number;
  lineHeight: number;
  strokeEnabled: boolean;
  strokeColor: string;
  strokeWidth: number;
};

const DEFAULT_TEXT_PRESETS: TextPreset[] = [
  { id: 'p1', name: 'Bold Title', category: 'title', fontFamily: 'Space Grotesk', fontSize: 72, fontWeight: '700', fill: '#ffffff', charSpacing: -20, lineHeight: 1.1, strokeEnabled: false, strokeColor: '#000000', strokeWidth: 0 },
  { id: 'p2', name: 'Elegant Heading', category: 'title', fontFamily: 'Playfair Display', fontSize: 56, fontWeight: '600', fill: '#ffffff', charSpacing: 0, lineHeight: 1.2, strokeEnabled: false, strokeColor: '#000000', strokeWidth: 0 },
  { id: 'p3', name: 'Subtitle', category: 'subtitle', fontFamily: 'Inter Tight', fontSize: 28, fontWeight: '500', fill: '#cccccc', charSpacing: 20, lineHeight: 1.4, strokeEnabled: false, strokeColor: '#000000', strokeWidth: 0 },
  { id: 'p4', name: 'Caption', category: 'caption', fontFamily: 'Inter Tight', fontSize: 16, fontWeight: '400', fill: '#999999', charSpacing: 40, lineHeight: 1.5, strokeEnabled: false, strokeColor: '#000000', strokeWidth: 0 },
];

interface EditorState {
  projectName: string;
  setProjectName: (name: string) => void;

  format: FormatPreset;
  setFormat: (format: FormatPreset) => void;

  slides: SlideData[];
  activeSlideIndex: number;
  setActiveSlideIndex: (index: number) => void;
  addSlide: () => void;
  duplicateSlide: (index: number) => void;
  deleteSlide: (index: number) => void;
  updateSlide: (index: number, data: Partial<SlideData>) => void;
  reorderSlides: (from: number, to: number) => void;

  activeTool: EditorTool;
  setActiveTool: (tool: EditorTool) => void;

  selectedObjectIds: string[];
  setSelectedObjectIds: (ids: string[]) => void;

  inspectorTab: 'design' | 'text' | 'image' | 'export';
  setInspectorTab: (tab: 'design' | 'text' | 'image' | 'export') => void;

  history: HistoryEntry[];
  historyIndex: number;
  pushHistory: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;

  fabricCanvas: any;
  setFabricCanvas: (canvas: any) => void;

  zoom: number;
  setZoom: (zoom: number) => void;

  exportScale: number;
  setExportScale: (scale: number) => void;
  transparentBg: boolean;
  setTransparentBg: (val: boolean) => void;

  // Recent colors
  recentColors: string[];
  addRecentColor: (color: string) => void;

  // Text presets
  textPresets: TextPreset[];
  addTextPreset: (preset: TextPreset) => void;
  removeTextPreset: (id: string) => void;

  // Theme
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;

  // Mobile
  mobilePanel: 'none' | 'layers' | 'inspector';
  setMobilePanel: (panel: 'none' | 'layers' | 'inspector') => void;
}

const generateId = () => Math.random().toString(36).substring(2, 10);

const createEmptySlide = (): SlideData => ({
  id: generateId(),
  objects: JSON.stringify({ version: '5.3.0', objects: [] }),
});

export const useEditorStore = create<EditorState>((set, get) => ({
  projectName: 'Untitled Project',
  setProjectName: (name) => set({ projectName: name }),

  format: FORMAT_PRESETS[0],
  setFormat: (format) => set({ format }),

  slides: [createEmptySlide()],
  activeSlideIndex: 0,
  setActiveSlideIndex: (index) => set({ activeSlideIndex: index }),

  addSlide: () => {
    const slides = [...get().slides, createEmptySlide()];
    set({ slides, activeSlideIndex: slides.length - 1 });
  },

  duplicateSlide: (index) => {
    const slides = [...get().slides];
    const copy = { ...slides[index], id: generateId() };
    slides.splice(index + 1, 0, copy);
    set({ slides, activeSlideIndex: index + 1 });
  },

  deleteSlide: (index) => {
    const slides = get().slides;
    if (slides.length <= 1) return;
    const newSlides = slides.filter((_, i) => i !== index);
    const newIndex = Math.min(get().activeSlideIndex, newSlides.length - 1);
    set({ slides: newSlides, activeSlideIndex: newIndex });
  },

  updateSlide: (index, data) => {
    const slides = [...get().slides];
    slides[index] = { ...slides[index], ...data };
    set({ slides });
  },

  reorderSlides: (from, to) => {
    const slides = [...get().slides];
    const [moved] = slides.splice(from, 1);
    slides.splice(to, 0, moved);
    set({ slides, activeSlideIndex: to });
  },

  activeTool: 'select',
  setActiveTool: (tool) => set({ activeTool: tool }),

  selectedObjectIds: [],
  setSelectedObjectIds: (ids) => set({ selectedObjectIds: ids }),

  inspectorTab: 'design',
  setInspectorTab: (tab) => set({ inspectorTab: tab }),

  history: [],
  historyIndex: -1,

  pushHistory: () => {
    const { slides, activeSlideIndex, history, historyIndex } = get();
    const entry: HistoryEntry = {
      slides: slides.map(s => ({ ...s })),
      activeSlideIndex,
    };
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(entry);
    if (newHistory.length > 50) newHistory.shift();
    set({ history: newHistory, historyIndex: newHistory.length - 1 });
  },

  undo: () => {
    const { historyIndex, history } = get();
    if (historyIndex <= 0) return;
    const entry = history[historyIndex - 1];
    set({
      slides: entry.slides,
      activeSlideIndex: entry.activeSlideIndex,
      historyIndex: historyIndex - 1,
    });
  },

  redo: () => {
    const { historyIndex, history } = get();
    if (historyIndex >= history.length - 1) return;
    const entry = history[historyIndex + 1];
    set({
      slides: entry.slides,
      activeSlideIndex: entry.activeSlideIndex,
      historyIndex: historyIndex + 1,
    });
  },

  canUndo: () => get().historyIndex > 0,
  canRedo: () => get().historyIndex < get().history.length - 1,

  fabricCanvas: null,
  setFabricCanvas: (canvas) => set({ fabricCanvas: canvas }),

  zoom: 1,
  setZoom: (zoom) => set({ zoom: Math.max(0.1, Math.min(5, zoom)) }),

  exportScale: 2,
  setExportScale: (scale) => set({ exportScale: scale }),

  transparentBg: false,
  setTransparentBg: (val) => set({ transparentBg: val }),

  recentColors: [],
  addRecentColor: (color) => {
    const colors = get().recentColors.filter(c => c !== color);
    colors.unshift(color);
    set({ recentColors: colors.slice(0, 16) });
  },

  textPresets: [...DEFAULT_TEXT_PRESETS],
  addTextPreset: (preset) => set({ textPresets: [...get().textPresets, preset] }),
  removeTextPreset: (id) => set({ textPresets: get().textPresets.filter(p => p.id !== id) }),

  theme: 'dark',
  setTheme: (theme) => {
    set({ theme });
    if (theme === 'light') {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    }
    localStorage.setItem('studio-theme', theme);
  },

  mobilePanel: 'none',
  setMobilePanel: (panel) => set({ mobilePanel: panel }),
}));
