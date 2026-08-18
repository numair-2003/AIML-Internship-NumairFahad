import { useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  Youtube,
  MessageSquare,
  FileText,
  HelpCircle,
  Layers,
  Zap,
  ArrowRight,
  Star,
  Brain,
  Trophy,
  ChevronRight,
  Play,
  Sparkles,
} from "lucide-react";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
  },
};

const stagger = {
  show: { transition: { staggerChildren: 0.1 } },
};

export function HomePage() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-[#080d1a] text-white font-sans overflow-x-hidden">
      {/* ─── CSS for gradient orbs animation ─── */}
      <style>{`
        @keyframes float-orb-1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(40px, -30px) scale(1.05); }
          66% { transform: translate(-20px, 20px) scale(0.95); }
        }
        @keyframes float-orb-2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(-50px, 25px) scale(0.95); }
          66% { transform: translate(30px, -40px) scale(1.08); }
        }
        @keyframes float-orb-3 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(20px, -20px) scale(1.06); }
        }
        .orb-1 { animation: float-orb-1 18s ease-in-out infinite; }
        .orb-2 { animation: float-orb-2 22s ease-in-out infinite; }
        .orb-3 { animation: float-orb-3 15s ease-in-out infinite; }
        .grid-dots {
          background-image: radial-gradient(circle, rgba(99,102,241,0.12) 1px, transparent 1px);
          background-size: 40px 40px;
        }
        .shimmer {
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent);
          background-size: 200% 100%;
          animation: shimmer 3s ease-in-out infinite;
        }
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        .glow-indigo { box-shadow: 0 0 40px rgba(99,102,241,0.25), 0 0 80px rgba(99,102,241,0.1); }
        .glow-violet { box-shadow: 0 0 40px rgba(139,92,246,0.2), 0 0 80px rgba(139,92,246,0.08); }
        .card-glow:hover { box-shadow: 0 0 30px rgba(99,102,241,0.15), 0 8px 32px rgba(0,0,0,0.4); }
        .text-gradient { background: linear-gradient(135deg, #818cf8 0%, #a78bfa 50%, #67e8f9 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .text-gradient-warm { background: linear-gradient(135deg, #f9a8d4 0%, #c084fc 50%, #818cf8 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .btn-primary { background: linear-gradient(135deg, #6366f1, #8b5cf6); box-shadow: 0 4px 24px rgba(99,102,241,0.4); }
        .btn-primary:hover { background: linear-gradient(135deg, #818cf8, #a78bfa); box-shadow: 0 8px 32px rgba(99,102,241,0.5); transform: translateY(-1px); }
        .btn-secondary { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); }
        .btn-secondary:hover { background: rgba(255,255,255,0.1); border-color: rgba(255,255,255,0.2); transform: translateY(-1px); }
      `}</style>

      {/* ─── Background ─── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="grid-dots absolute inset-0 opacity-60" />
        <div className="orb-1 absolute top-[-10%] left-[-5%] w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-[80px]" />
        <div className="orb-2 absolute top-[20%] right-[-10%] w-[500px] h-[500px] bg-violet-600/15 rounded-full blur-[100px]" />
        <div className="orb-3 absolute bottom-[-15%] left-[30%] w-[450px] h-[450px] bg-cyan-600/10 rounded-full blur-[80px]" />
      </div>

      {/* ─── Navbar ─── */}
      <nav className="relative z-50 flex items-center justify-between px-6 md:px-10 py-5 max-w-7xl mx-auto">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center glow-indigo">
            <Play className="h-4.5 w-4.5 text-white fill-white" />
          </div>
          <span className="font-extrabold text-xl tracking-tight">
            <span className="text-gradient">Learn</span>Tube
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setLocation("/app")}
            className="btn-secondary px-5 py-2 rounded-xl text-sm font-semibold text-slate-200 transition-all duration-200"
          >
            Open workspace
          </button>
          <button
            onClick={() => setLocation("/app")}
            className="btn-primary px-5 py-2 rounded-xl text-sm font-semibold text-white transition-all duration-200"
          >
            Start learning
          </button>
        </div>
      </nav>

      {/* ─── Hero ─── */}
      <section className="relative z-10 pt-16 pb-24 px-6 md:px-10 text-center max-w-5xl mx-auto">
        <motion.div initial="hidden" animate="show" variants={stagger}>
          <motion.div variants={fadeUp}>
            <span className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-4 py-2 mb-8">
              <Sparkles className="h-3.5 w-3.5" />
              Powered by Gemini AI
            </span>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            className="text-5xl md:text-7xl font-extrabold leading-tight tracking-tight mb-6"
          >
            Turn any YouTube video
            <br />
            into a{" "}
            <span className="text-gradient">learning experience</span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Paste a YouTube URL and instantly get AI-powered chat, summaries, quizzes, and
            flashcards. Learn smarter, retain more, waste less time.
          </motion.p>

          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => setLocation("/app")}
              className="btn-primary flex items-center gap-2 px-8 py-4 rounded-2xl text-base font-bold text-white transition-all duration-200 group"
            >
              Start learning now
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => setLocation("/app")}
              className="btn-secondary flex items-center gap-2 px-8 py-4 rounded-2xl text-base font-semibold text-slate-200 transition-all duration-200"
            >
              <Play className="h-4 w-4 text-indigo-400" />
              Open workspace
            </button>
          </motion.div>
        </motion.div>

        {/* Hero app preview card */}
        <motion.div
          initial={{ opacity: 0, y: 48, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="mt-16 relative cursor-pointer group"
          onClick={() => setLocation("/app")}
          role="button"
          aria-label="Open LearnTube workspace"
        >
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-b from-indigo-500/20 to-transparent blur-2xl scale-110 group-hover:from-indigo-500/30 transition-all duration-300" />
          {/* Hover overlay CTA */}
          <div className="absolute inset-0 rounded-3xl bg-indigo-900/0 group-hover:bg-indigo-900/40 transition-all duration-300 z-10 flex items-center justify-center pointer-events-none">
            <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 transform scale-90 group-hover:scale-100 bg-indigo-500 text-white font-bold px-6 py-3 rounded-2xl shadow-lg shadow-indigo-500/40 flex items-center gap-2">
              <Play className="h-4 w-4 fill-white" />
              Try it for free →
            </div>
          </div>
          <div className="relative rounded-3xl border border-slate-700/60 bg-slate-900/80 backdrop-blur-xl overflow-hidden glow-indigo group-hover:border-indigo-500/40 transition-all duration-300">
            {/* Mock browser bar */}
            <div className="flex items-center gap-2 px-5 py-3 border-b border-slate-700/60 bg-slate-800/60">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <div className="w-3 h-3 rounded-full bg-green-500/80" />
              </div>
              <div className="flex-1 mx-3 h-6 rounded-md bg-slate-700/60 flex items-center px-3">
                <span className="text-slate-500 text-xs">learntube.replit.app/app</span>
              </div>
            </div>
            {/* Mock workspace preview */}
            <div className="grid grid-cols-5 h-72 md:h-96">
              {/* Sidebar mock */}
              <div className="col-span-1 border-r border-slate-700/60 bg-slate-900/60 p-3 hidden md:block">
                <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-3 px-1">Library</div>
                {[1, 2, 3].map((i) => (
                  <div key={i} className={`flex items-center gap-2 rounded-xl p-2 mb-1 ${i === 1 ? "bg-indigo-500/10 border border-indigo-500/20" : "hover:bg-slate-800/60"}`}>
                    <div className={`w-8 h-8 rounded-lg flex-shrink-0 ${i === 1 ? "bg-indigo-500/30" : "bg-slate-700/60"}`} />
                    <div className="min-w-0">
                      <div className={`h-2 rounded-full mb-1.5 ${i === 1 ? "bg-indigo-400/60 w-20" : "bg-slate-600/60 w-16"}`} />
                      <div className="h-1.5 rounded-full bg-slate-700/60 w-12" />
                    </div>
                  </div>
                ))}
              </div>
              {/* Content mock */}
              <div className="col-span-5 md:col-span-4 p-4 flex flex-col gap-3">
                {/* Video player stub */}
                <div className="rounded-2xl bg-slate-800/60 border border-slate-700/40 h-28 flex items-center justify-center shrink-0">
                  <div className="flex items-center gap-3">
                    <motion.div
                      animate={{ scale: [1, 1.12, 1], boxShadow: ["0 0 0 0 rgba(99,102,241,0)", "0 0 0 8px rgba(99,102,241,0.25)", "0 0 0 0 rgba(99,102,241,0)"] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center cursor-pointer"
                    >
                      <Play className="h-5 w-5 text-white ml-0.5" />
                    </motion.div>
                    <div>
                      <div className="h-2.5 rounded-full bg-slate-600/80 w-40 mb-2" />
                      <div className="h-1.5 rounded-full bg-slate-700/60 w-28" />
                    </div>
                  </div>
                </div>
                {/* Chat messages stub */}
                <div className="flex-1 flex flex-col gap-2.5 overflow-hidden">
                  <div className="flex items-start gap-2">
                    <div className="w-6 h-6 rounded-full bg-slate-700/80 shrink-0 mt-0.5" />
                    <div className="bg-slate-800/60 rounded-2xl rounded-tl-sm px-3.5 py-2.5 max-w-[70%]">
                      <div className="h-1.5 rounded-full bg-slate-600/80 w-48 mb-1.5" />
                      <div className="h-1.5 rounded-full bg-slate-600/60 w-36" />
                    </div>
                  </div>
                  <div className="flex items-start gap-2 flex-row-reverse">
                    <div className="w-6 h-6 rounded-full bg-indigo-500/80 shrink-0 mt-0.5" />
                    <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl rounded-tr-sm px-3.5 py-2.5 max-w-[75%]">
                      <div className="h-1.5 rounded-full bg-indigo-400/60 w-52 mb-1.5" />
                      <div className="h-1.5 rounded-full bg-indigo-400/40 w-40 mb-1.5" />
                      <div className="h-1.5 rounded-full bg-indigo-400/40 w-32" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-auto">
                    <div className="flex-1 h-9 rounded-xl bg-slate-800/60 border border-slate-700/40 flex items-center px-4">
                      <div className="h-1.5 rounded-full bg-slate-700/60 w-48" />
                    </div>
                    <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
                      <ArrowRight className="h-3.5 w-3.5 text-indigo-400" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ─── Stats ─── */}
      <section className="relative z-10 py-14 px-6 md:px-10 max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {[
            { value: "10s", label: "To process any video" },
            { value: "5+", label: "Learning modes" },
            { value: "100%", label: "Powered by Google Gemini AI" },
            { value: "Free", label: "To get started" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="text-center p-6 rounded-2xl border border-slate-700/50 bg-slate-900/50 backdrop-blur-sm"
            >
              <div className="text-3xl font-extrabold text-gradient mb-1">{stat.value}</div>
              <div className="text-sm text-slate-400">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </section>

      {/* ─── Features ─── */}
      <section className="relative z-10 py-16 px-6 md:px-10 max-w-6xl mx-auto">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          variants={stagger}
          className="text-center mb-14"
        >
          <motion.div variants={fadeUp}>
            <span className="inline-flex items-center gap-2 text-xs font-semibold text-violet-300 bg-violet-500/10 border border-violet-500/20 rounded-full px-4 py-2 mb-5">
              <Zap className="h-3.5 w-3.5" />
              Everything you need
            </span>
          </motion.div>
          <motion.h2 variants={fadeUp} className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
            Four ways to learn from{" "}
            <span className="text-gradient-warm">any video</span>
          </motion.h2>
          <motion.p variants={fadeUp} className="text-slate-400 text-lg max-w-xl mx-auto">
            AI extracts the knowledge, you absorb it your way.
          </motion.p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
          variants={stagger}
          className="grid grid-cols-1 md:grid-cols-2 gap-5"
        >
          {[
            {
              icon: <MessageSquare className="h-6 w-6" />,
              color: "from-indigo-500 to-blue-600",
              glow: "rgba(99,102,241,0.2)",
              title: "Smart Chat",
              description:
                "Ask anything about the video in natural language. Get timestamped answers that jump to the exact moment in the video.",
              badge: "RAG-powered",
            },
            {
              icon: <FileText className="h-6 w-6" />,
              color: "from-violet-500 to-purple-600",
              glow: "rgba(139,92,246,0.2)",
              title: "AI Summaries",
              description:
                "Instantly get a structured overview with key points and chapter-by-chapter breakdown. Perfect for quick review.",
              badge: "Auto-generated",
            },
            {
              icon: <HelpCircle className="h-6 w-6" />,
              color: "from-cyan-500 to-teal-600",
              glow: "rgba(6,182,212,0.2)",
              title: "Practice Quizzes",
              description:
                "Test your understanding with AI-generated multiple choice questions. Get instant feedback and explanations.",
              badge: "Adaptive",
            },
            {
              icon: <Layers className="h-6 w-6" />,
              color: "from-pink-500 to-rose-600",
              glow: "rgba(236,72,153,0.2)",
              title: "Flashcard Decks",
              description:
                "Flip through concept cards to reinforce memory. Mark mastered cards to focus on what you don't know yet.",
              badge: "Spaced repetition",
            },
          ].map((feature) => (
            <motion.div
              key={feature.title}
              variants={fadeUp}
              className="group relative rounded-3xl border border-slate-700/50 bg-slate-900/60 p-7 backdrop-blur-sm cursor-default card-glow transition-all duration-300 overflow-hidden"
            >
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl"
                style={{ background: `radial-gradient(400px at 50% 50%, ${feature.glow}, transparent)` }}
              />
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-5">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center text-white shadow-lg`}>
                    {feature.icon}
                  </div>
                  <span className="text-xs font-semibold text-slate-400 bg-slate-800/80 border border-slate-700/60 rounded-full px-3 py-1">
                    {feature.badge}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2.5">{feature.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{feature.description}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ─── How it works ─── */}
      <section className="relative z-10 py-16 px-6 md:px-10 max-w-5xl mx-auto">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          variants={stagger}
          className="text-center mb-14"
        >
          <motion.h2 variants={fadeUp} className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
            Up and running in{" "}
            <span className="text-gradient">30 seconds</span>
          </motion.h2>
          <motion.p variants={fadeUp} className="text-slate-400 text-lg max-w-xl mx-auto">
            No setup. No configuration. Just paste and learn.
          </motion.p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-40px" }}
          variants={stagger}
          className="grid grid-cols-1 md:grid-cols-3 gap-5 relative"
        >
          {/* Connector line (desktop only) */}
          <div className="hidden md:block absolute top-[52px] left-[calc(16.67%+24px)] right-[calc(16.67%+24px)] h-px bg-gradient-to-r from-indigo-500/30 via-violet-500/30 to-cyan-500/30" />

          {[
            {
              step: "01",
              icon: <Youtube className="h-6 w-6" />,
              color: "from-red-500 to-rose-600",
              title: "Paste a YouTube URL",
              description: "Any YouTube video — lectures, tutorials, documentaries. Just paste the link.",
            },
            {
              step: "02",
              icon: <Brain className="h-6 w-6" />,
              color: "from-indigo-500 to-violet-600",
              title: "AI processes it",
              description: "Our AI extracts the transcript, chunks it, and builds a knowledge base in seconds.",
            },
            {
              step: "03",
              icon: <Trophy className="h-6 w-6" />,
              color: "from-amber-500 to-orange-600",
              title: "Learn your way",
              description: "Chat, read summaries, take quizzes, or review flashcards — whatever works for you.",
            },
          ].map((step) => (
            <motion.div
              key={step.step}
              variants={fadeUp}
              className="relative flex flex-col items-center text-center p-7 rounded-3xl border border-slate-700/50 bg-slate-900/60 backdrop-blur-sm"
            >
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center text-white mb-5 shadow-xl relative z-10`}>
                {step.icon}
              </div>
              <div className="text-xs font-bold text-slate-600 mb-2 tracking-widest uppercase">{step.step}</div>
              <h3 className="text-lg font-bold text-white mb-2">{step.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{step.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ─── Testimonials ─── */}
      <section className="relative z-10 py-16 px-6 md:px-10 max-w-6xl mx-auto">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          variants={stagger}
          className="grid grid-cols-1 md:grid-cols-3 gap-5"
        >
          {[
            {
              quote: "I processed a 3-hour machine learning lecture and had a quiz ready in under a minute. This is the future of learning.",
              name: "Alex K.",
              role: "CS Student",
              stars: 5,
            },
            {
              quote: "The timestamped chat is insane. I can ask 'explain the part about gradient descent' and it jumps right to it.",
              name: "Maya R.",
              role: "Self-taught Developer",
              stars: 5,
            },
            {
              quote: "I use it for every research video I watch. The AI summaries alone save me hours of note-taking every week.",
              name: "Daniel S.",
              role: "PhD Researcher",
              stars: 5,
            },
          ].map((t) => (
            <motion.div
              key={t.name}
              variants={fadeUp}
              className="p-6 rounded-3xl border border-slate-700/50 bg-slate-900/60 backdrop-blur-sm"
            >
              <div className="flex gap-1 mb-4">
                {Array.from({ length: t.stars }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 text-amber-400 fill-amber-400" />
                ))}
              </div>
              <p className="text-slate-300 text-sm leading-relaxed mb-5">"{t.quote}"</p>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-sm">
                  {t.name[0]}
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">{t.name}</div>
                  <div className="text-xs text-slate-500">{t.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ─── CTA ─── */}
      <section className="relative z-10 py-20 px-6 md:px-10 max-w-4xl mx-auto text-center">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          variants={stagger}
        >
          <motion.div variants={fadeUp} className="relative rounded-3xl overflow-hidden">
            {/* Background glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/60 via-violet-900/40 to-slate-900/80 border border-indigo-500/20 rounded-3xl" />
            <div className="absolute inset-0 grid-dots opacity-40" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-48 bg-indigo-500/20 rounded-full blur-3xl" />

            <div className="relative z-10 py-16 px-8">
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-4 py-2 mb-6">
                <Sparkles className="h-3.5 w-3.5" />
                Join thousands of learners
              </div>
              <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-5">
                Ready to learn{" "}
                <span className="text-gradient">smarter?</span>
              </h2>
              <p className="text-slate-400 text-lg mb-8 max-w-xl mx-auto">
                No account required. Transform any YouTube video into an interactive learning
                session in seconds.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                  onClick={() => setLocation("/app")}
                  className="btn-primary flex items-center gap-2.5 px-8 py-4 rounded-2xl text-base font-bold text-white transition-all duration-200 group"
                >
                  Start learning
                  <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </button>
                <button
                  onClick={() => setLocation("/app")}
                  className="btn-secondary flex items-center gap-2 px-8 py-4 rounded-2xl text-base font-semibold text-slate-200 transition-all duration-200"
                >
                  Open workspace
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="relative z-10 border-t border-slate-800/60 py-10 px-6 md:px-10">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
              <Play className="h-3.5 w-3.5 text-white fill-white" />
            </div>
            <span className="font-bold text-white tracking-tight">
              <span className="text-gradient">Learn</span>Tube
            </span>
          </div>
          <p className="text-slate-600 text-sm">
            Built with ❤️ for learners everywhere
          </p>
          <div className="flex items-center gap-6">
            {["Privacy", "Terms", "Support"].map((link) => (
              <a key={link} href="#" className="text-slate-600 hover:text-slate-400 text-sm transition-colors">
                {link}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
