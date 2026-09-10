import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, Instagram, Layers, Type, Image, Download, Gamepad2 } from 'lucide-react';
import { motion } from 'framer-motion';

const features = [
  { icon: Type, label: 'Advanced Typography', desc: 'Full font controls with Google Fonts' },
  { icon: Layers, label: 'Layer System', desc: 'Professional layer management' },
  { icon: Image, label: 'Image Editing', desc: 'Lightroom-style adjustments' },
  { icon: Download, label: 'Export & Share', desc: 'PNG, JPEG, ZIP export' },
];

export default function Index() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-2xl"
      >
        <div className="flex items-center justify-center gap-2 mb-6">
          <Sparkles className="text-primary" size={28} />
          <h1 className="text-3xl font-display font-bold text-foreground">
            Content Studio
          </h1>
        </div>

        <p className="text-muted-foreground text-lg mb-2">
          Professional content creation for Instagram creators
        </p>
        <p className="text-muted-foreground/60 text-sm mb-10">
          Posts · Carousels · Stories · Wallpapers
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => navigate('/editor')}
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-8 py-3 rounded-xl text-sm font-semibold hover:bg-primary/90 transition-all hover:gap-3 shadow-lg shadow-primary/25"
          >
            Open Editor
            <ArrowRight size={16} />
          </button>

          <button
            onClick={() => navigate('/park')}
            className="inline-flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-extrabold text-white transition-transform hover:scale-105 shadow-lg"
            style={{ background: 'linear-gradient(90deg,#ff2d78,#ff8f3d,#ffd93d,#3ddc97,#4cc9ff)' }}
          >
            <Gamepad2 size={16} />
            KTAMIZEN Park Edition
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-16">
          {features.map((f, i) => (
            <motion.div
              key={f.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 + i * 0.1 }}
              className="bg-card border border-border rounded-xl p-4 text-left"
            >
              <f.icon size={20} className="text-primary mb-2" />
              <h3 className="text-sm font-semibold text-foreground">{f.label}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
