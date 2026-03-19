import { useState } from 'react';
import {
  ChevronDown, BookOpen, Award, Zap, ShieldCheck, BarChart2,
  Star, Globe, FileText, Users, RefreshCw, Settings, BarChart2 as BarChart,
  CheckCircle, XCircle, AlertTriangle, Flag, Clock, Infinity,
  ListChecks, ExternalLink, Cpu, Key, Lock, CalendarCheck,
  GraduationCap, BadgeCheck, Flame, Server, Building, Briefcase,
  LineChart, Target, Cloud,
} from 'lucide-react';

function SectionToggle({ open, onToggle, title, subtitle, accentColor }) {
  return (
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between group text-left"
    >
      <div>
        <h3 className="text-2xl font-extrabold text-slate-800 flex items-center gap-3">
          <span className={`w-1 h-7 rounded-full ${accentColor} inline-block`} />
          {title}
        </h3>
        {subtitle && <p className="text-slate-500 mt-1 ml-4 text-sm">{subtitle}</p>}
      </div>
      <div className={`flex-shrink-0 ml-4 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${open ? 'bg-slate-200 rotate-180' : 'bg-slate-100 group-hover:bg-slate-200'}`}>
        <ChevronDown className="w-4 h-4 text-slate-600" />
      </div>
    </button>
  );
}

export default function AppFooter({ gameState }) {
  const [featuresOpen, setFeaturesOpen] = useState(true);
  const [agenticOpen, setAgenticOpen] = useState(false);
  const [howToOpen, setHowToOpen] = useState(false);

  if (gameState !== 'menu' && gameState !== 'results') return null;

  return (
    <footer className="max-w-6xl mx-auto px-4 py-12 mt-12 border-t border-slate-200 animate-fade-in space-y-8">

      {/* ── Features & Benefits ── */}
      <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-6 py-5 bg-white">
          <SectionToggle
            open={featuresOpen}
            onToggle={() => setFeaturesOpen(o => !o)}
            title="Features &amp; Benefits"
            subtitle="Everything built into this tool to maximize your exam readiness."
            accentColor="bg-pink-500"
          />
        </div>
        {featuresOpen && (
          <div className="px-6 pb-8 pt-2 bg-slate-50/40 animate-fade-in">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 text-sm text-slate-600">

              <div className="bg-white p-5 rounded-xl border-2 border-purple-200 flex gap-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 text-xs font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-bl-lg border-l border-b border-purple-200">Agentic</div>
                <div className="w-10 h-10 bg-purple-100 flex items-center justify-center rounded-lg flex-shrink-0"><ShieldCheck className="w-5 h-5 text-purple-600" /></div>
                <div>
                  <h4 className="font-bold text-slate-800 mb-1">Self-Validation Pipeline</h4>
                  <p>A Layer 1 agent reviews every generated question against 6 quality rules — answer mismatches, duplicates, formatting issues, difficulty calibration — then auto-regenerates failures across up to 4 refinement cycles.</p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border-2 border-teal-200 flex gap-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 text-xs font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-bl-lg border-l border-b border-teal-200">Agentic</div>
                <div className="w-10 h-10 bg-teal-100 flex items-center justify-center rounded-lg flex-shrink-0"><BookOpen className="w-5 h-5 text-teal-600" /></div>
                <div>
                  <h4 className="font-bold text-slate-800 mb-1">RAG-Grounded on Splunk Docs</h4>
                  <p>A Layer 2 retrieval agent embeds your exam context, queries a Cloudflare Vectorize index of real Splunk documentation, and injects the top 15 matching passages directly into the generation prompt.</p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border-2 border-orange-200 flex gap-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 text-xs font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-bl-lg border-l border-b border-orange-200">Agentic</div>
                <div className="w-10 h-10 bg-orange-100 flex items-center justify-center rounded-lg flex-shrink-0"><BarChart2 className="w-5 h-5 text-orange-600" /></div>
                <div>
                  <h4 className="font-bold text-slate-800 mb-1">Adaptive Learning Agent</h4>
                  <p>A Layer 3 agent tracks your per-topic error rates and validation failure signals across sessions in Cloudflare D1. Each new exam automatically reweights question distribution toward your weakest areas.</p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border-2 border-indigo-200 flex gap-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-bl-lg border-l border-b border-indigo-200">Agentic</div>
                <div className="w-10 h-10 bg-indigo-100 flex items-center justify-center rounded-lg flex-shrink-0"><Star className="w-5 h-5 text-indigo-600" /></div>
                <div>
                  <h4 className="font-bold text-slate-800 mb-1">Depth-Escalating Explainer Agent</h4>
                  <p>A lazy explanation agent activates per wrong answer on demand. It reads your <code className="text-xs bg-slate-100 px-1 rounded">times_missed</code> count from D1 and escalates explanation depth — basic → detailed → first-principles — the more a concept has been missed.</p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border-2 border-pink-200 flex gap-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 text-xs font-bold text-pink-600 bg-pink-50 px-2 py-0.5 rounded-bl-lg border-l border-b border-pink-200">Agentic</div>
                <div className="w-10 h-10 bg-pink-100 flex items-center justify-center rounded-lg flex-shrink-0"><RefreshCw className="w-5 h-5 text-pink-600" /></div>
                <div>
                  <h4 className="font-bold text-slate-800 mb-1">Spaced Repetition Review Agent</h4>
                  <p>Missed questions are stored in D1 and scheduled via a 1→3→7→14→30→60 day interval algorithm. The review session agent blends stored wrong answers with freshly generated AI questions on the same weak topics.</p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border-2 border-slate-200 flex gap-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 text-xs font-bold text-slate-500 bg-slate-50 px-2 py-0.5 rounded-bl-lg border-l border-b border-slate-200">Cross-layer</div>
                <div className="w-10 h-10 bg-slate-100 flex items-center justify-center rounded-lg flex-shrink-0"><Zap className="w-5 h-5 text-slate-600" /></div>
                <div>
                  <h4 className="font-bold text-slate-800 mb-1">L1 → L3 Quality Feedback Loop</h4>
                  <p>Validation failure rates from Layer 1 are written into the adaptive profile in Layer 3. Topics that historically cause the AI to generate bad questions receive an explicit quality warning in future generation prompts.</p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex gap-4">
                <div className="w-10 h-10 bg-pink-100 flex items-center justify-center rounded-lg flex-shrink-0"><Zap className="w-5 h-5 text-pink-600" /></div>
                <div>
                  <h4 className="font-bold text-slate-800 mb-1">AI-Powered Question Generation</h4>
                  <p>Questions are generated fresh every session using Groq/Llama, Gemini, Perplexity, or Qwen — no static question banks, no repetition. Token budget scales automatically with question count.</p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex gap-4">
                <div className="w-10 h-10 bg-blue-100 flex items-center justify-center rounded-lg flex-shrink-0"><FileText className="w-5 h-5 text-blue-600" /></div>
                <div>
                  <h4 className="font-bold text-slate-800 mb-1">Official Exam Blueprint Integration</h4>
                  <p>Each cert card shows the official Splunk exam blueprint — questions, time limit, passing score, level, and topic weight percentages sourced directly from Splunk's PDFs.</p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex gap-4">
                <div className="w-10 h-10 bg-cyan-100 flex items-center justify-center rounded-lg flex-shrink-0"><Users className="w-5 h-5 text-cyan-600" /></div>
                <div>
                  <h4 className="font-bold text-slate-800 mb-1">Community Difficulty Heatmap</h4>
                  <p>Aggregated anonymized error rates from all users are shown per topic on each certification card, revealing which topics the community finds hardest before you even start.</p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex gap-4">
                <div className="w-10 h-10 bg-rose-100 flex items-center justify-center rounded-lg flex-shrink-0"><Globe className="w-5 h-5 text-rose-600" /></div>
                <div>
                  <h4 className="font-bold text-slate-800 mb-1">Live Web Search Mode</h4>
                  <p>Switch to the Perplexity engine to generate questions grounded in live Splunk documentation searches — ideal for keeping up with the latest product changes.</p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex gap-4">
                <div className="w-10 h-10 bg-green-100 flex items-center justify-center rounded-lg flex-shrink-0"><ShieldCheck className="w-5 h-5 text-green-600" /></div>
                <div>
                  <h4 className="font-bold text-slate-800 mb-1">JSON Schema Enforcement</h4>
                  <p>Groq and Qwen calls use <code className="text-xs bg-slate-100 px-1 rounded">response_format: json_object</code> mode, eliminating markdown fence hacks. Every generation also logs a trace object — provider, tokens, latency, parse strategy, retries.</p>
                </div>
              </div>

            </div>
          </div>
        )}
      </div>

      {/* ── Agentic Architecture Flow ── */}
      <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-6 py-5 bg-white">
          <SectionToggle
            open={agenticOpen}
            onToggle={() => setAgenticOpen(o => !o)}
            title="Agentic AI Architecture"
            subtitle="How the four agents collaborate on every exam generation."
            accentColor="bg-purple-500"
          />
        </div>
        {agenticOpen && (
          <div className="px-6 pb-8 pt-4 bg-gradient-to-b from-slate-50/60 to-white animate-fade-in">
            <div className="relative">
              <div className="absolute left-6 top-10 bottom-10 w-0.5 bg-gradient-to-b from-purple-200 via-teal-200 via-orange-200 to-indigo-200 hidden md:block" />
              <div className="space-y-4">

                <div className="flex gap-4 items-start">
                  <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center flex-shrink-0 z-10 shadow-lg">
                    <Settings className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-grow bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <h4 className="font-bold text-slate-800 text-sm">User configures exam</h4>
                      <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-mono">trigger</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Selects cert, question count, topics, provider. Adaptive context is read from D1 before generation starts.</p>
                  </div>
                </div>

                <div className="flex gap-4 items-center ml-5">
                  <div className="w-2 h-2 rounded-full bg-teal-400 z-10" />
                  <div className="text-xs text-teal-600 font-semibold">RAG retrieval</div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="w-12 h-12 rounded-full bg-teal-500 flex items-center justify-center flex-shrink-0 z-10 shadow-lg">
                    <BookOpen className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-grow bg-white border-2 border-teal-200 rounded-xl p-4 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 text-xs font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-bl-lg border-l border-b border-teal-200">Layer 2</div>
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h4 className="font-bold text-slate-800 text-sm">RAG Retrieval Agent</h4>
                      <span className="text-xs bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full font-mono border border-teal-200">Cloudflare Workers AI + Vectorize</span>
                    </div>
                    <p className="text-xs text-slate-500">Embeds the exam query via <code className="bg-slate-100 px-1 rounded">bge-small-en-v1.5</code>, runs cosine similarity search against the <code className="bg-slate-100 px-1 rounded">splunk-docs-index</code>, returns top-15 Splunk doc passages. Falls back to unfiltered if cert-filtered results are sparse.</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">384-dim embeddings</span>
                      <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">cosine similarity</span>
                      <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">score &gt; 0.3 filter</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 items-center ml-5">
                  <div className="w-2 h-2 rounded-full bg-pink-400 z-10" />
                  <div className="text-xs text-pink-600 font-semibold">doc passages injected into prompt → LLM generates</div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="w-12 h-12 rounded-full bg-pink-500 flex items-center justify-center flex-shrink-0 z-10 shadow-lg">
                    <Zap className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-grow bg-white border-2 border-pink-200 rounded-xl p-4 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 text-xs font-bold text-pink-700 bg-pink-50 px-2 py-0.5 rounded-bl-lg border-l border-b border-pink-200">Generation</div>
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h4 className="font-bold text-slate-800 text-sm">AI Question Generator</h4>
                      <span className="text-xs bg-pink-50 text-pink-700 px-2 py-0.5 rounded-full font-mono border border-pink-200">Groq / Gemini / Perplexity / Qwen</span>
                    </div>
                    <p className="text-xs text-slate-500">Generates questions grounded in RAG passages with blueprint topic distribution, adaptive weighting, difficulty calibration, and topic boundary rules. Uses <code className="bg-slate-100 px-1 rounded">response_format: json_object</code> on supported providers to eliminate parse failures.</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">JSON schema enforced</span>
                      <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">adaptive prompt weighting</span>
                      <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">token-scaled output</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 items-center ml-5">
                  <div className="w-2 h-2 rounded-full bg-purple-400 z-10" />
                  <div className="text-xs text-purple-600 font-semibold">raw questions → validation pipeline</div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="w-12 h-12 rounded-full bg-purple-500 flex items-center justify-center flex-shrink-0 z-10 shadow-lg">
                    <ShieldCheck className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-grow bg-white border-2 border-purple-200 rounded-xl p-4 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 text-xs font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-bl-lg border-l border-b border-purple-200">Layer 1</div>
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h4 className="font-bold text-slate-800 text-sm">Self-Validation &amp; Refinement Agent</h4>
                      <span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full font-mono border border-purple-200">Groq Llama 3.3</span>
                    </div>
                    <p className="text-xs text-slate-500">Checks all questions against 6 rules (answer match, no duplicates, parallel options, no forbidden phrases, difficulty calibration, question integrity). Questions failing above the 10% threshold trigger targeted regeneration. Max 4 cycles.</p>
                    <div className="mt-2 grid grid-cols-2 gap-1.5">
                      {['6 quality rules', '10% failure threshold', 'max 4 retry cycles', 'failure rates → Layer 3'].map(tag => (
                        <div key={tag} className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 rounded-lg px-2 py-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-purple-400 flex-shrink-0" />
                          {tag}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 items-center ml-5">
                  <div className="w-2 h-2 rounded-full bg-orange-400 z-10" />
                  <div className="text-xs text-orange-600 font-semibold">exam runs → results + profile update</div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="w-12 h-12 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0 z-10 shadow-lg">
                    <BarChart2 className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-grow bg-white border-2 border-orange-200 rounded-xl p-4 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 text-xs font-bold text-orange-700 bg-orange-50 px-2 py-0.5 rounded-bl-lg border-l border-b border-orange-200">Layer 3</div>
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h4 className="font-bold text-slate-800 text-sm">Adaptive Learning Agent</h4>
                      <span className="text-xs bg-orange-50 text-orange-700 px-2 py-0.5 rounded-full font-mono border border-orange-200">Cloudflare D1</span>
                    </div>
                    <p className="text-xs text-slate-500">After each session, writes per-topic error rates and Layer 1 validation failure signals to D1. On the next exam, <code className="bg-slate-100 px-1 rounded">buildAdaptiveContext</code> reads the profile and overrides blueprint question counts — topics with &gt;60% error rate get 1.8× the base allocation.</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {['error rate tracking', 'trend detection', 'L1 quality signals', 'anonymous cross-device ID'].map(tag => (
                        <span key={tag} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{tag}</span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 items-center ml-5">
                  <div className="w-2 h-2 rounded-full bg-indigo-400 z-10" />
                  <div className="text-xs text-indigo-600 font-semibold">wrong answers → lazy explanation on demand</div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="w-12 h-12 rounded-full bg-indigo-500 flex items-center justify-center flex-shrink-0 z-10 shadow-lg">
                    <Star className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-grow bg-white border-2 border-indigo-200 rounded-xl p-4 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-bl-lg border-l border-b border-indigo-200">On-demand</div>
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h4 className="font-bold text-slate-800 text-sm">Depth-Escalating Explainer Agent</h4>
                      <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-mono border border-indigo-200">Groq Llama 3.3</span>
                    </div>
                    <p className="text-xs text-slate-500">Activates lazily when a user clicks <span className="font-semibold text-indigo-600">Why?</span> on a wrong answer. Reads <code className="bg-slate-100 px-1 rounded">times_missed</code> from D1 and chooses explanation depth: basic (1 miss) → detailed (2 misses) → first-principles with analogy (3+ misses).</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {[['1× → basic', 'indigo'], ['2× → detailed', 'indigo'], ['3× → deep', 'indigo']].map(([tag]) => (
                        <span key={tag} className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-100">{tag}</span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="ml-16 flex items-center gap-3 bg-gradient-to-r from-purple-50 to-orange-50 border border-purple-100 rounded-xl px-4 py-3">
                  <RefreshCw className="w-4 h-4 text-purple-500 flex-shrink-0" />
                  <p className="text-xs text-slate-600"><span className="font-semibold text-purple-700">Cross-layer feedback loop:</span> Layer 1 validation failure rates per topic are stored in Layer 3's adaptive profile and re-injected as generation quality warnings on every subsequent prompt — the system gets smarter about its own weak spots.</p>
                </div>

              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── How to Use ── */}
      <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-6 py-5 bg-white">
          <SectionToggle
            open={howToOpen}
            onToggle={() => setHowToOpen(o => !o)}
            title="How to Use This Tool"
            subtitle="Follow these steps to get the most out of each study session."
            accentColor="bg-blue-500"
          />
        </div>
        {howToOpen && (
          <div className="px-6 pb-8 pt-4 bg-slate-50/40 animate-fade-in">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 text-sm text-slate-600">
              {[
                { n: '1', title: 'Select a Certification', body: "Pick the Splunk cert track you're studying for. Each card shows a community difficulty heatmap and links to the official exam blueprint." },
                { n: '2', title: 'Configure Your Exam', body: 'Choose the number of questions, focus on specific blueprint topics, toggle the timer, and select your AI generator engine. Optionally customize the prompt directly.' },
                { n: '3', title: 'Take the Exam', body: 'Answer all questions before submitting. Use the navigator to jump between questions, flag items for review, and track your progress with the answer bar.' },
                { n: '4', title: 'Review & Improve', body: 'See your score, review wrong answers with AI explanations, launch a spaced-repetition review session, and track your adaptive learning profile across sessions.' },
              ].map(({ n, title, body }) => (
                <div key={n} className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
                  <div className="w-8 h-8 bg-pink-100 text-pink-600 font-bold flex items-center justify-center rounded-full mb-3">{n}</div>
                  <h4 className="font-bold text-slate-800 mb-1">{title}</h4>
                  <p>{body}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Attribution ── */}
      <div className="text-center text-xs text-slate-400 pb-4">
        <p>This is a personal project and is not officially affiliated with or endorsed by Splunk Inc.</p>
      </div>

    </footer>
  );
}
