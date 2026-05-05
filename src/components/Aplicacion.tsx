import { motion, AnimatePresence } from "motion/react";
import { Radio, Megaphone, Mic2, Users, TrendingUp, Sparkles, MessageSquare, Play, Globe } from "lucide-react";
import { useState, useEffect } from "react";

export default function Aplicacion() {
  const [activeSlide, setActiveSlide] = useState(0);

  const slides = [
    {
      title: "LLEGA A MUCHOS MÁS CADA DÍA",
      subtitle: "Llega a miles de oyentes en tiempo real.",
      icon: <Megaphone className="w-12 h-12 text-[#00f2ff]" />,
      color: "bg-[#00f2ff]"
    },
    {
      title: "AUDIENCIA FIEL",
      subtitle: "Tu mensaje en los programas más escuchados.",
      icon: <Users className="w-12 h-12 text-[#ff007f]" />,
      color: "bg-[#ff007f]"
    },
    {
      title: "RESULTADOS REALES",
      subtitle: "Incrementa tus ventas con publicidad directa.",
      icon: <TrendingUp className="w-12 h-12 text-blue-400" />,
      color: "bg-blue-400"
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative pt-24 pb-32 px-4 md:p-8 flex flex-col items-center justify-center overflow-hidden min-h-[calc(100vh-80px)]">
      {/* Background Shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-100px] left-[-100px] w-80 h-80 bg-[#00f2ff] rounded-full mix-blend-screen opacity-20 blur-[80px]" />
        <div className="absolute bottom-[-150px] right-[-50px] w-[500px] h-[500px] bg-[#ff007f] rounded-full mix-blend-screen opacity-10 blur-[100px]" />
      </div>

      <main className="relative z-10 w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Left Side: Animated Promotion */}
        <div className="space-y-8 flex flex-col items-center lg:items-start text-center lg:text-left">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex flex-col items-center lg:items-start"
          >
            <h1 className="text-6xl md:text-8xl font-black leading-none tracking-tighter uppercase mb-6 italic">
              ¡TU MARCA <br />
              <span className="text-[#00f2ff]">EN EL AIRE!</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-white/80 font-medium max-w-lg leading-tight">
              Llega a muchos oyentes diarios y haz que tu negocio sea el protagonista.
            </p>
          </motion.div>

          <div className="flex flex-col md:flex-row gap-6 pt-4 items-center">
            <motion.a
              href="https://wa.me/1159204990"
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-[#ff007f] hover:bg-[#ff007f]/80 text-white px-10 py-5 rounded-full font-black uppercase tracking-wide text-lg shadow-xl shadow-[#ff007f]/30 transition-all flex items-center gap-3"
            >
              Publicita Ahora
            </motion.a>
            
            <div className="text-center lg:text-left">
              <div className="text-[10px] text-white/50 uppercase tracking-widest font-bold">Contacto Directo</div>
              <div className="text-2xl font-black text-white italic">1159204990</div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6 pt-12 border-t border-white/10 w-full">
            <div className="bg-white/5 p-4 rounded-3xl border border-white/5 flex flex-col items-center">
              <div className="text-3xl font-black text-[#00f2ff]">45k+</div>
              <div className="text-[10px] uppercase tracking-widest text-white/60 mt-1 font-bold">Alcance/Hora</div>
            </div>
            <div className="bg-white/5 p-4 rounded-3xl border border-white/5 flex flex-col items-center">
              <div className="text-3xl font-black text-[#ff007f]">88%</div>
              <div className="text-[10px] uppercase tracking-widest text-white/60 mt-1 font-bold">Retención</div>
            </div>
            <div className="bg-white/5 p-4 rounded-3xl border border-white/5 flex flex-col items-center">
              <div className="text-3xl font-black text-purple-400">24/7</div>
              <div className="text-[10px] uppercase tracking-widest text-white/60 mt-1 font-bold">Programación</div>
            </div>
          </div>
        </div>

        {/* Right Side: Animated Cards/Visuals */}
        <div className="relative h-[500px] flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSlide}
              initial={{ opacity: 0, scale: 0.8, rotateY: 30 }}
              animate={{ opacity: 1, scale: 1, rotateY: 0 }}
              exit={{ opacity: 0, scale: 1.1, rotateY: -30 }}
              transition={{ duration: 0.6, ease: "circOut" }}
              className="absolute w-full max-w-sm aspect-[4/5] bg-white/5 border border-white/10 rounded-[2.5rem] p-10 flex flex-col items-center justify-center text-center gap-6 backdrop-blur-xl overflow-hidden shadow-2xl shadow-black/50"
            >
              {/* Decorative elements inside card */}
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#00f2ff] to-transparent opacity-50" />
              <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-[#00f2ff]/10 blur-[60px] rounded-full" />
              
              <motion.div 
                animate={{ y: [0, -10, 0], rotate: [0, 5, -5, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                className="w-28 h-28 rounded-3xl bg-white/5 flex items-center justify-center border border-white/10 shadow-2xl"
              >
                {slides[activeSlide].icon}
              </motion.div>
              
              <div className="space-y-3">
                <h3 className="text-4xl font-black italic tracking-tighter uppercase">{slides[activeSlide].title}</h3>
                <p className="text-white/80 text-lg font-medium leading-tight opacity-80">{slides[activeSlide].subtitle}</p>
              </div>

              <div className="pt-6 flex gap-2">
                {slides.map((_, idx) => (
                  <div 
                    key={idx} 
                    className={`h-1.5 transition-all duration-500 rounded-full ${idx === activeSlide ? "w-10 bg-[#00f2ff] shadow-[0_0_10px_rgba(0,242,255,0.5)]" : "w-2 bg-white/10"}`}
                  />
                ))}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Background decorative circles */}
          <div className="absolute inset-0 z-0 flex items-center justify-center opacity-10">
            <div className="w-[350px] h-[350px] rounded-full border border-dashed border-[#00f2ff] animate-[spin_25s_linear_infinite]" />
            <div className="absolute w-[500px] h-[500px] rounded-full border border-dashed border-[#ff007f] animate-[spin_40s_linear_reverse_infinite]" />
          </div>
        </div>
      </main>

      {/* Audio Visualization Bars */}
      <div className="absolute bottom-0 w-full flex items-end justify-center px-12 space-x-2 opacity-20 h-24 pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            animate={{ height: [`${20 + Math.random() * 60}%`, `${40 + Math.random() * 50}%`, `${20 + Math.random() * 60}%`] }}
            transition={{ duration: 1 + Math.random(), repeat: Infinity, ease: "easeInOut" }}
            className={`w-3 md:w-5 rounded-t-xl ${i % 3 === 0 ? "bg-[#00f2ff]" : i % 3 === 1 ? "bg-[#ff007f]" : "bg-white/20"}`}
          />
        ))}
      </div>
    </div>
  );
}
