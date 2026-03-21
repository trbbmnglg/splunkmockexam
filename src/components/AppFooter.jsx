import { useState } from 'react';
import {
  ChevronDown, BookOpen, Award, Zap, ShieldCheck, BarChart2,
  Star, Globe, FileText, Users, RefreshCw, Settings, BarChart2 as BarChart,
  CheckCircle, XCircle, AlertTriangle, Flag, Clock, Infinity,
  ListChecks, ExternalLink, Cpu, Key, Lock, CalendarCheck,
  GraduationCap, BadgeCheck, Flame, Server, Building, Briefcase,
  LineChart, Target, Cloud, Filter, Link, Shield, Database, Repeat,
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
            subtitle="All 16 agentic features built into this tool to maximize your exam readiness."
            accentColor="bg-pink-500"
          />
        </div>
        {featuresOpen && (
          <div className="px-6 pb-8 pt-2 bg-slate-50/40 animate-fade-in">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 text-sm text-slate-600">

              <div className="bg-white p-5 rounded-xl border-2 border-purple-200 flex gap-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 text-xs font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-bl-lg border-l border-b border-purple-200">Agentic · Layer 1</div>
                <div className="w-10 h-10 bg-purple-100 flex items-center justify-center rounded-lg flex-shrink-0"><ShieldCheck className="w-5 h-5 text-purple-600" /></div>
                <div>
                  <h4 className="font-bold text-slate-800 mb-1">Self-Validation Pipeline</h4>
                  <p>Every generated question is reviewed by a secondary Groq agent against 6 quality rules — answer-option mismatches, duplicates, formatting parity, forbidden phrases, difficulty calibration, and question integrity. Failures above the 10% threshold trigger targeted regeneration across up to 4 refinement cycles. Shared-key users get 1 lightweight cycle; own-key users get all 4.</p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border-2 border-teal-200 flex gap-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 text-xs font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-bl-lg border-l border-b border-teal-200">Agentic · Layer 2</div>
                <div className="w-10 h-10 bg-teal-100 flex items-center justify-center rounded-lg flex-shrink-0"><BookOpen className="w-5 h-5 text-teal-600" /></div>
                <div>
                  <h4 className="font-bold text-slate-800 mb-1">3-Step RAG Pipeline</h4>
                  <p>A retrieval agent runs a 3-step pipeline before every exam: <strong>(1)</strong> embeds the query via <code className="text-xs bg-slate-100 px-1 rounded">bge-small-en-v1.5</code> and fetches up to 15 candidates from Cloudflare Vectorize (cosine ≥ 0.5); <strong>(2)</strong> re-ranks them with the Jina Reranker v3 for contextual precision with an 8s timeout; <strong>(3)</strong> injects the top 5 passages directly into the generation prompt. Falls back gracefully to Vectorize top-5 if Jina times out.</p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border-2 border-orange-200 flex gap-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 text-xs font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-bl-lg border-l border-b border-orange-200">Agentic · Layer 3</div>
                <div className="w-10 h-10 bg-orange-100 flex items-center justify-center rounded-lg flex-shrink-0"><BarChart2 className="w-5 h-5 text-orange-600" /></div>
                <div>
                  <h4 className="font-bold text-slate-800 mb-1">Adaptive Learning Agent</h4>
                  <p>A Layer 3 agent tracks per-topic error rates and Layer 1 validation failure signals across sessions in Cloudflare D1. Each new exam automatically reweights question distribution toward your weakest areas — topics with &gt;60% error rate receive 1.8× the base allocation. Layer 1 failure rates per topic are also stored and fed back as generation quality warnings.</p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border-2 border-indigo-200 flex gap-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-bl-lg border-l border-b border-indigo-200">Agentic · On-demand</div>
                <div className="w-10 h-10 bg-indigo-100 flex items-center justify-center rounded-lg flex-shrink-0"><Star className="w-5 h-5 text-indigo-600" /></div>
                <div>
                  <h4 className="font-bold text-slate-800 mb-1">RAG-Grounded Explainer Agent</h4>
                  <p>The "Why?" explainer runs its own independent RAG retrieval per wrong answer — fetching the most relevant Splunk doc passage for that specific topic before calling Groq. Explanation depth escalates based on <code className="text-xs bg-slate-100 px-1 rounded">times_missed</code> from D1: basic (1×) → detailed (2×) → first-principles with analogy (3×+). The doc link resolves from the RAG-retrieved URL, discarding any stale generation-time source.</p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border-2 border-pink-200 flex gap-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 text-xs font-bold text-pink-600 bg-pink-50 px-2 py-0.5 rounded-bl-lg border-l border-b border-pink-200">Agentic · On-demand</div>
                <div className="w-10 h-10 bg-pink-100 flex items-center justify-center rounded-lg flex-shrink-0"><RefreshCw className="w-5 h-5 text-pink-600" /></div>
                <div>
                  <h4 className="font-bold text-slate-800 mb-1">Spaced Repetition Review Agent</h4>
                  <p>Missed questions are persisted to Cloudflare D1 with a 1→3→7→14→30→60 day spaced repetition schedule. Review sessions blend stored wrong answers with freshly generated AI questions on the same weak topics. Reviewed questions are cleared from the bank via hash-matched DELETE calls after each session.</p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border-2 border-cyan-200 flex gap-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 text-xs font-bold text-cyan-600 bg-cyan-50 px-2 py-0.5 rounded-bl-lg border-l border-b border-cyan-200">Agentic · Per-session</div>
                <div className="w-10 h-10 bg-cyan-100 flex items-center justify-center rounded-lg flex-shrink-0"><Repeat className="w-5 h-5 text-cyan-600" /></div>
                <div>
                  <h4 className="font-bold text-slate-800 mb-1">Cross-Session Duplicate Detection</h4>
                  <p>After every exam, all question stems are hashed and saved to D1's <code className="text-xs bg-slate-100 px-1 rounded">seen_concepts</code> table (capped at 100 per cert). Before generation, the last 50 concept hints are fetched and injected into the prompt as hard exclusions — grouped by topic — so the AI cannot regenerate questions on concepts you've already seen. RAG and dedup fetches run in parallel, adding zero extra latency.</p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border-2 border-slate-200 flex gap-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 text-xs font-bold text-slate-500 bg-slate-50 px-2 py-0.5 rounded-bl-lg border-l border-b border-slate-200">Cross-layer</div>
                <div className="w-10 h-10 bg-slate-100 flex items-center justify-center rounded-lg flex-shrink-0"><Zap className="w-5 h-5 text-slate-600" /></div>
                <div>
                  <h4 className="font-bold text-slate-800 mb-1">L1 → L3 Quality Feedback Loop</h4>
                  <p>Validation failure rates from Layer 1 are written into the adaptive profile in Layer 3. Topics that historically cause the AI to produce bad questions receive an explicit quality warning injected into every subsequent generation prompt — the system learns its own blind spots over time.</p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border-2 border-violet-200 flex gap-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 text-xs font-bold text-violet-600 bg-violet-50 px-2 py-0.5 rounded-bl-lg border-l border-b border-violet-200">Observability</div>
                <div className="w-10 h-10 bg-violet-100 flex items-center justify-center rounded-lg flex-shrink-0"><Database className="w-5 h-5 text-violet-600" /></div>
                <div>
                  <h4 className="font-bold text-slate-800 mb-1">Agent Trace Persistence</h4>
                  <p>Every generation run writes a full trace to D1's <code className="text-xs bg-slate-100 px-1 rounded">generation_traces</code> table — provider, model, prompt and completion token counts, latency, parse strategy, retry count, validation cycles and failures, and RAG passage count. This creates a longitudinal record for diagnosing quality regressions and tracking cost trends over time.</p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex gap-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-bl-lg border-l border-b border-emerald-200">Post-generation</div>
                <div className="w-10 h-10 bg-emerald-100 flex items-center justify-center rounded-lg flex-shrink-0"><Filter className="w-5 h-5 text-emerald-600" /></div>
                <div>
                  <h4 className="font-bold text-slate-800 mb-1">Hallucinated URL Filter</h4>
                  <p>After every generation, a <code className="text-xs bg-slate-100 px-1 rounded">filterDocSources</code> pass strips any <code className="text-xs bg-slate-100 px-1 rounded">docSource</code> URL that wasn't present in the injected RAG passages — preventing the model from fabricating plausible-looking but fake Splunk documentation links. Cleared URLs fall back to the RAG-grounded explainer at review time.</p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex gap-4">
                <div className="w-10 h-10 bg-pink-100 flex items-center justify-center rounded-lg flex-shrink-0"><Zap className="w-5 h-5 text-pink-600" /></div>
                <div>
                  <h4 className="font-bold text-slate-800 mb-1">Multi-Provider AI Generation</h4>
                  <p>Questions are generated fresh every session using Groq/Llama, Gemini, Perplexity, or Qwen — no static question banks, no repetition. Groq and Qwen use <code className="text-xs bg-slate-100 px-1 rounded">response_format: json_object</code> for schema-enforced output. A <code className="text-xs bg-slate-100 px-1 rounded">safeJsonParse</code> layer handles malformed JSON from models that emit bare control characters. Token budget scales automatically with question count.</p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex gap-4">
                <div className="w-10 h-10 bg-blue-100 flex items-center justify-center rounded-lg flex-shrink-0"><FileText className="w-5 h-5 text-blue-600" /></div>
                <div>
                  <h4 className="font-bold text-slate-800 mb-1">Official Exam Blueprint Integration</h4>
                  <p>Each cert card shows the official Splunk exam blueprint — questions, time limit, passing score, level, and topic weight percentages sourced directly from Splunk's PDFs. Topic distribution is enforced both at generation time and overridden by adaptive weighting when your profile has enough sessions.</p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex gap-4">
                <div className="w-10 h-10 bg-cyan-100 flex items-center justify-center rounded-lg flex-shrink-0"><Users className="w-5 h-5 text-cyan-600" /></div>
                <div>
                  <h4 className="font-bold text-slate-800 mb-1">Community Difficulty Heatmap</h4>
                  <p>Aggregated anonymized error rates from all users are written to Cloudflare D1's <code className="text-xs bg-slate-100 px-1 rounded">community_stats</code> table after every session and displayed per topic on each certification card — revealing which topics the community finds hardest before you even start.</p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex gap-4">
                <div className="w-10 h-10 bg-rose-100 flex items-center justify-center rounded-lg flex-shrink-0"><Globe className="w-5 h-5 text-rose-600" /></div>
                <div>
                  <h4 className="font-bold text-slate-800 mb-1">Live Web Search Mode</h4>
                  <p>Switch to the Perplexity engine to generate questions grounded in live Splunk documentation searches — ideal for keeping up with the latest product changes beyond the RAG index's ingestion date.</p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex gap-4">
                <div className="w-10 h-10 bg-slate-100 flex items-center justify-center rounded-lg flex-shrink-0"><Shield className="w-5 h-5 text-slate-600" /></div>
                <div>
                  <h4 className="font-bold text-slate-800 mb-1">Dual-Signal Usage Rate Limiting</h4>
                  <p>Shared-key users are limited to 10 free exams per day, enforced by tracking both the anonymous user ID and a hashed client IP independently in D1. Either signal hitting the limit blocks the session — preventing bypass via incognito or localStorage clearing. Own-key users bypass all limits entirely.</p>
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
            subtitle="How the six agents and three layers collaborate on every exam generation."
            accentColor="bg-purple-500"
          />
        </div>
        {agenticOpen && (
          <div className="px-6 pb-8 pt-4 bg-gradient-to-b from-slate-50/60 to-white animate-fade-in">
            <div className="relative">
              <div className="absolute left-6 top-10 bottom-10 w-0.5 bg-gradient-to-b from-purple-200 via-teal-200 via-orange-200 to-indigo-200 hidden md:block" />
              <div className="space-y-4">

                {/* Trigger */}
                <div className="flex gap-4 items-start">
                  <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center flex-shrink-0 z-10 shadow-lg">
                    <Settings className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-grow bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <h4 className="font-bold text-slate-800 text-sm">User configures exam</h4>
                      <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-mono">trigger</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Selects cert, question count, topics, provider. Adaptive context is read from D1 and merged with blueprint weights before generation starts. Usage limit is checked for shared-key users (userId + IP).</p>
                  </div>
                </div>

                <div className="flex gap-4 items-center ml-5">
                  <div className="w-2 h-2 rounded-full bg-teal-400 z-10" />
                  <div className="text-xs text-teal-600 font-semibold">Layer 2 — 3-step RAG retrieval + cross-session dedup fetch (parallel)</div>
                </div>

                {/* Layer 2 RAG + Dedup */}
                <div className="flex gap-4 items-start">
                  <div className="w-12 h-12 rounded-full bg-teal-500 flex items-center justify-center flex-shrink-0 z-10 shadow-lg">
                    <BookOpen className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-grow bg-white border-2 border-teal-200 rounded-xl p-4 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 text-xs font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-bl-lg border-l border-b border-teal-200">Layer 2 · RAG Agent + Dedup</div>
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h4 className="font-bold text-slate-800 text-sm">Retrieve → Rerank → Inject + Load Seen Concepts</h4>
                      <span className="text-xs bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full font-mono border border-teal-200">Vectorize + Jina v3 + Workers AI + D1</span>
                    </div>
                    <p className="text-xs text-slate-500"><strong>RAG Step 1:</strong> Embeds the exam query via <code className="bg-slate-100 px-1 rounded">bge-small-en-v1.5</code>, fetches up to 15 candidates from <code className="bg-slate-100 px-1 rounded">splunk-docs-index</code> (cosine ≥ 0.5, cert-filtered first with unfiltered fallback). <strong>Step 2:</strong> Jina Reranker v3 re-scores all candidates with an 8s timeout — falls back to top-5 by Vectorize score if Jina fails. <strong>Step 3:</strong> The 5 highest-ranked passages are injected into the generation prompt. <strong>Dedup (parallel):</strong> The last 50 seen concept hints are fetched from D1's <code className="bg-slate-100 px-1 rounded">seen_concepts</code> table simultaneously — zero added latency. Both signals are merged into the final prompt.</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">384-dim embeddings</span>
                      <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">cosine ≥ 0.5</span>
                      <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">Jina reranker v3</span>
                      <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">top-5 injected</span>
                      <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">50 seen concepts injected</span>
                      <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">graceful fallback</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 items-center ml-5">
                  <div className="w-2 h-2 rounded-full bg-pink-400 z-10" />
                  <div className="text-xs text-pink-600 font-semibold">doc passages + seen concepts + adaptive context injected into prompt → LLM generates</div>
                </div>

                {/* Generation */}
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
                    <p className="text-xs text-slate-500">Generates questions grounded in RAG passages with blueprint topic distribution, adaptive weighting, difficulty calibration, strict topic boundary rules, and cross-session duplicate exclusions. Groq and Qwen use <code className="bg-slate-100 px-1 rounded">response_format: json_object</code> for schema enforcement. A <code className="bg-slate-100 px-1 rounded">safeJsonParse</code> layer sanitizes bare control characters before parsing. Post-generation, <code className="bg-slate-100 px-1 rounded">filterDocSources</code> strips any <code className="bg-slate-100 px-1 rounded">docSource</code> URL not present in the injected passages to prevent hallucinated links.</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">JSON schema enforced</span>
                      <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">adaptive prompt weighting</span>
                      <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">dedup exclusions injected</span>
                      <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">hallucinated URL filter</span>
                      <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">token-scaled output</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 items-center ml-5">
                  <div className="w-2 h-2 rounded-full bg-purple-400 z-10" />
                  <div className="text-xs text-purple-600 font-semibold">raw questions → Layer 1 validation pipeline</div>
                </div>

                {/* Layer 1 Validation */}
                <div className="flex gap-4 items-start">
                  <div className="w-12 h-12 rounded-full bg-purple-500 flex items-center justify-center flex-shrink-0 z-10 shadow-lg">
                    <ShieldCheck className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-grow bg-white border-2 border-purple-200 rounded-xl p-4 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 text-xs font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-bl-lg border-l border-b border-purple-200">Layer 1 · Validator</div>
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h4 className="font-bold text-slate-800 text-sm">Self-Validation &amp; Refinement Agent</h4>
                      <span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full font-mono border border-purple-200">Groq Llama 3.3</span>
                    </div>
                    <p className="text-xs text-slate-500">Checks all questions against 6 rules (answer-option exact match, no duplicates, parallel options, no forbidden phrases, difficulty calibration, question integrity). Failures above the 10% threshold trigger targeted regeneration with replacement questions on the same topic. Max 4 cycles for own-key users; 1 lightweight cycle for shared-key users to protect quota. Per-cycle failure rates are logged and passed to Layer 3.</p>
                    <div className="mt-2 grid grid-cols-2 gap-1.5">
                      {['6 quality rules', '10% failure threshold', 'max 4 retry cycles (own key)', '1 cycle (shared key)', 'targeted regeneration', 'failure rates → Layer 3'].map(tag => (
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
                  <div className="text-xs text-orange-600 font-semibold">exam runs → results + Layer 3 profile update + seen concepts saved + trace persisted</div>
                </div>

                {/* Layer 3 Adaptive */}
                <div className="flex gap-4 items-start">
                  <div className="w-12 h-12 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0 z-10 shadow-lg">
                    <BarChart2 className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-grow bg-white border-2 border-orange-200 rounded-xl p-4 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 text-xs font-bold text-orange-700 bg-orange-50 px-2 py-0.5 rounded-bl-lg border-l border-b border-orange-200">Layer 3 · Adaptive + Post-exam writes</div>
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h4 className="font-bold text-slate-800 text-sm">Adaptive Learning Agent</h4>
                      <span className="text-xs bg-orange-50 text-orange-700 px-2 py-0.5 rounded-full font-mono border border-orange-200">Cloudflare D1</span>
                    </div>
                    <p className="text-xs text-slate-500">After each session, writes per-topic error rates, trend signals, and Layer 1 validation failure rates to D1. Also writes anonymized stats to <code className="bg-slate-100 px-1 rounded">community_stats</code>, persists missed questions to <code className="bg-slate-100 px-1 rounded">wrong_answers</code> with spaced repetition scheduling, saves all question stems to <code className="bg-slate-100 px-1 rounded">seen_concepts</code> for future dedup, and writes a full generation trace to <code className="bg-slate-100 px-1 rounded">generation_traces</code>. On the next exam, <code className="bg-slate-100 px-1 rounded">buildAdaptiveContext</code> reads the profile and overrides blueprint question counts — topics with &gt;60% error rate get 1.8× allocation. Topics with high Layer 1 failure rates inject a generation quality warning into the prompt.</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {['error rate + trend tracking', 'L1 validation failure rates', 'community stats (anonymized)', 'spaced repetition scheduling', 'seen concepts (dedup)', 'generation trace (observability)'].map(tag => (
                        <span key={tag} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{tag}</span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 items-center ml-5">
                  <div className="w-2 h-2 rounded-full bg-indigo-400 z-10" />
                  <div className="text-xs text-indigo-600 font-semibold">wrong answers → RAG-grounded explainer on demand</div>
                </div>

                {/* Explainer */}
                <div className="flex gap-4 items-start">
                  <div className="w-12 h-12 rounded-full bg-indigo-500 flex items-center justify-center flex-shrink-0 z-10 shadow-lg">
                    <Star className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-grow bg-white border-2 border-indigo-200 rounded-xl p-4 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-bl-lg border-l border-b border-indigo-200">On-demand · Explainer</div>
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h4 className="font-bold text-slate-800 text-sm">RAG-Grounded Depth-Escalating Explainer</h4>
                      <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-mono border border-indigo-200">Groq Llama 3.3 + Vectorize</span>
                    </div>
                    <p className="text-xs text-slate-500">Activates lazily when a user clicks <span className="font-semibold text-indigo-600">Why?</span> on a wrong answer. First runs its own independent RAG retrieval for that specific topic via <code className="bg-slate-100 px-1 rounded">/api/retrieve</code>, then injects the passage into the explanation prompt. Reads <code className="bg-slate-100 px-1 rounded">times_missed</code> from D1 and chooses depth: basic (1×) → detailed (2×) → first-principles with analogy (3×+). The "Open Docs" link resolves from the RAG-retrieved URL — stale generation-time sources are discarded when RAG grounding is active.</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {[['1× → basic', 'indigo'], ['2× → detailed', 'indigo'], ['3× → deep + analogy', 'indigo'], ['RAG URL wins over stale source', 'indigo']].map(([tag]) => (
                        <span key={tag} className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-100">{tag}</span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Cross-layer feedback loop callout */}
                <div className="ml-16 flex items-center gap-3 bg-gradient-to-r from-purple-50 to-orange-50 border border-purple-100 rounded-xl px-4 py-3">
                  <RefreshCw className="w-4 h-4 text-purple-500 flex-shrink-0" />
                  <p className="text-xs text-slate-600"><span className="font-semibold text-purple-700">Cross-layer feedback loop:</span> Layer 1 validation failure rates per topic are stored in Layer 3's adaptive profile and re-injected as generation quality warnings on every subsequent prompt. Seen concepts from Layer 3 feed back into Layer 2's prompt as hard exclusions. The Jina reranker's graceful fallback ensures Layer 2 never blocks exam generation. The explainer's independent RAG call means doc grounding is always fresh, even if the generation-time source was hallucinated. Every generation run writes a full trace to D1 for observability.</p>
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
                {
                  n: '1',
                  title: 'Select a Certification',
                  body: "Pick the Splunk cert track you're studying for. Each card shows a community difficulty heatmap sourced from anonymized D1 aggregates and links to the official exam blueprint.",
                },
                {
                  n: '2',
                  title: 'Configure Your Exam',
                  body: 'Choose the number of questions, focus on specific blueprint topics, toggle the timer, and select your AI generator engine. The prompt updates dynamically with RAG passages, adaptive weighting, and cross-session duplicate exclusions — all wired in automatically.',
                },
                {
                  n: '3',
                  title: 'Take the Exam',
                  body: 'Answer all questions before submitting. Use the navigator to jump between questions, flag items for review, and track your progress with the answer bar. Every question set is unique — the dedup agent ensures you never see the same concept twice across sessions.',
                },
                {
                  n: '4',
                  title: 'Review & Improve',
                  body: 'See your score, click "Why?" on any wrong answer for a RAG-grounded AI explanation, launch a spaced-repetition review session, and watch your adaptive profile reweight future exams toward your weak spots. All question stems are saved as seen concepts so the next session is always fresh.',
                },
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
