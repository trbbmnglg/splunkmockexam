import { useEffect } from 'react';
import {
  X, BookOpen, Zap, ShieldCheck, BarChart2,
  Star, Globe, FileText, Users, RefreshCw, Settings,
  Filter, Shield, Database, Repeat,
} from 'lucide-react';

/* ─── Feature card ───────────────────────────────────────────────────────── */
function FeatCard({ icon: Icon, iconBg, iconColor, title, badge, badgeBg, badgeColor, badgeBorder, borderColor, children }) {
  return (
    <div className={`bg-white p-5 rounded-xl flex gap-4 relative overflow-hidden border-2 ${borderColor}`}>
      {badge && (
        <div className={`absolute top-0 right-0 text-xs font-bold px-2 py-0.5 rounded-bl-lg border-l border-b ${badgeBg} ${badgeColor} ${badgeBorder}`}>
          {badge}
        </div>
      )}
      <div className={`w-10 h-10 ${iconBg} flex items-center justify-center rounded-lg flex-shrink-0 mt-0.5`}>
        <Icon className={`w-5 h-5 ${iconColor}`} />
      </div>
      <div className="min-w-0">
        <h4 className="font-semibold text-slate-900 mb-1.5 text-sm leading-snug">{title}</h4>
        <p className="text-sm text-slate-600 leading-relaxed">{children}</p>
      </div>
    </div>
  );
}

/* ─── Arch step (original vertical stepper) ─────────────────────────────── */
function ArchStep({ icon: Icon, iconBg, title, badge, badgeBg, badgeColor, badgeBorder, desc, tags, tagsBg, tagsColor, tagsBorder, subgrid, connector, connectorText, connectorColor }) {
  return (
    <>
      {connector && (
        <div className="flex gap-4 items-center ml-5 py-1">
          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${connectorColor}`} />
          <div className={`text-xs font-semibold ${connectorColor.replace('bg-', 'text-')}`}>{connectorText}</div>
        </div>
      )}
      <div className="flex gap-4 items-start">
        <div className={`w-12 h-12 rounded-full ${iconBg} flex items-center justify-center flex-shrink-0 z-10 shadow-lg`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div className="flex-grow bg-white border-2 border-slate-100 rounded-xl p-4 shadow-sm relative overflow-hidden" style={{ borderColor: badge ? undefined : undefined }}>
          {badge && (
            <div className={`absolute top-0 right-0 text-xs font-bold px-2 py-0.5 rounded-bl-lg border-l border-b ${badgeBg} ${badgeColor} ${badgeBorder}`}>
              {badge}
            </div>
          )}
          <h4 className="font-semibold text-slate-800 text-sm mb-1">{title}</h4>
          <p className="text-xs text-slate-500 leading-relaxed mb-2">{desc}</p>
          {tags && (
            <div className={`flex flex-wrap gap-1.5 ${subgrid ? 'grid grid-cols-2' : ''}`}>
              {tags.map(t => (
                <div key={t} className={`flex items-center gap-1.5 text-xs rounded-lg px-2 py-1 ${tagsBg || 'bg-slate-50'} ${tagsColor || 'text-slate-600'}`}>
                  {subgrid && <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${tagsBorder || 'bg-slate-400'}`} />}
                  {t}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

/* ─── Main drawer ────────────────────────────────────────────────────────── */
export default function AppInfoDrawer({ open, onClose }) {
  // Lock body scroll when open
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] flex justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative w-full max-w-3xl h-full bg-[#f3f4f6] shadow-2xl flex flex-col overflow-hidden animate-slide-in-right">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white flex-shrink-0">
          <div>
            <div className="font-bold text-lg">About this tool</div>
            <div className="text-slate-400 text-xs mt-0.5">16 agentic features · Cloudflare Workers + D1 + Vectorize</div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-700 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-10">

          {/* ── Features & Benefits ── */}
          <section>
            <h2 className="text-xl font-extrabold text-slate-800 mb-1">Features &amp; Benefits</h2>
            <p className="text-slate-500 text-sm mb-5">All 16 agentic features built into this tool to maximize your exam readiness.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              <FeatCard icon={ShieldCheck} iconBg="bg-purple-100" iconColor="text-purple-600" title="Self-Validation Pipeline" badge="Agentic · Layer 1" badgeBg="bg-purple-50" badgeColor="text-purple-600" badgeBorder="border-purple-200" borderColor="border-purple-200">
                Every generated question is reviewed by a secondary Groq agent against 6 quality rules — answer-option mismatches, duplicates, formatting parity, forbidden phrases, difficulty calibration, and question integrity. Failures above the 10% threshold trigger targeted regeneration across up to 4 refinement cycles. Shared-key users get 1 lightweight cycle; own-key users get all 4.
              </FeatCard>

              <FeatCard icon={BookOpen} iconBg="bg-teal-100" iconColor="text-teal-600" title="3-Step RAG Pipeline" badge="Agentic · Layer 2" badgeBg="bg-teal-50" badgeColor="text-teal-600" badgeBorder="border-teal-200" borderColor="border-teal-200">
                Embed → Vectorize (15 candidates, cosine ≥ 0.5) → Jina Reranker v3 (8s timeout) → top-5 passages injected into every prompt. Falls back gracefully to Vectorize top-5 if Jina times out.
              </FeatCard>

              <FeatCard icon={BarChart2} iconBg="bg-orange-100" iconColor="text-orange-600" title="Adaptive Learning Agent" badge="Agentic · Layer 3" badgeBg="bg-orange-50" badgeColor="text-orange-600" badgeBorder="border-orange-200" borderColor="border-orange-200">
                Per-topic error rates and Layer 1 failure signals tracked across sessions in D1. Each new exam reweights question distribution toward your weakest areas — topics with &gt;60% error rate receive 1.8× the base allocation.
              </FeatCard>

              <FeatCard icon={Star} iconBg="bg-indigo-100" iconColor="text-indigo-600" title="RAG-Grounded Explainer Agent" badge="Agentic · On-demand" badgeBg="bg-indigo-50" badgeColor="text-indigo-600" badgeBorder="border-indigo-200" borderColor="border-indigo-200">
                The "Why?" explainer runs its own independent RAG retrieval per wrong answer. Depth escalates with <code className="text-xs bg-slate-100 px-1 rounded">times_missed</code>: basic (1×) → detailed (2×) → first-principles with analogy (3×+). Doc link resolves from the RAG-retrieved URL, not any stale generation-time source.
              </FeatCard>

              <FeatCard icon={RefreshCw} iconBg="bg-pink-100" iconColor="text-pink-600" title="Spaced Repetition Review Agent" badge="Agentic · On-demand" badgeBg="bg-pink-50" badgeColor="text-pink-600" badgeBorder="border-pink-200" borderColor="border-pink-200">
                Missed questions persisted to D1 on a 1→3→7→14→30→60 day schedule. Review sessions blend stored wrong answers with freshly generated AI questions on the same weak topics. Reviewed questions cleared via hash-matched DELETE after each session.
              </FeatCard>

              <FeatCard icon={Repeat} iconBg="bg-cyan-100" iconColor="text-cyan-600" title="Cross-Session Duplicate Detection" badge="Agentic · Per-session" badgeBg="bg-cyan-50" badgeColor="text-cyan-600" badgeBorder="border-cyan-200" borderColor="border-cyan-200">
                After every exam, question stems are hashed and saved to D1 (capped at 100 per cert). Before generation, the last 50 concept hints are fetched and injected as hard exclusions — grouped by topic. RAG and dedup fetches run in parallel, adding zero extra latency.
              </FeatCard>

              <FeatCard icon={Zap} iconBg="bg-slate-100" iconColor="text-slate-600" title="L1 → L3 Quality Feedback Loop" badge="Cross-layer" badgeBg="bg-slate-50" badgeColor="text-slate-500" badgeBorder="border-slate-200" borderColor="border-slate-200">
                Layer 1 validation failure rates written into Layer 3's adaptive profile. Topics that historically cause the AI to produce bad questions receive an explicit quality warning injected into every subsequent generation prompt — the system learns its own blind spots over time.
              </FeatCard>

              <FeatCard icon={Database} iconBg="bg-violet-100" iconColor="text-violet-600" title="Agent Trace Persistence" badge="Observability" badgeBg="bg-violet-50" badgeColor="text-violet-600" badgeBorder="border-violet-200" borderColor="border-violet-200">
                Every generation run writes a full trace to D1's <code className="text-xs bg-slate-100 px-1 rounded">generation_traces</code> table — provider, model, token counts, latency, parse strategy, retry count, validation cycles and failures, and RAG passage count.
              </FeatCard>

              <FeatCard icon={Filter} iconBg="bg-emerald-100" iconColor="text-emerald-600" title="Hallucinated URL Filter" badge="Post-generation" badgeBg="bg-emerald-50" badgeColor="text-emerald-600" badgeBorder="border-emerald-200" borderColor="border-emerald-200">
                After every generation, <code className="text-xs bg-slate-100 px-1 rounded">filterDocSources</code> strips any <code className="text-xs bg-slate-100 px-1 rounded">docSource</code> URL not present in the injected RAG passages — preventing the model from fabricating plausible-looking but fake Splunk documentation links.
              </FeatCard>

              <FeatCard icon={Zap} iconBg="bg-pink-100" iconColor="text-pink-600" title="Multi-Provider AI Generation" borderColor="border-slate-100">
                Fresh questions every session via Groq/Llama, Gemini, Perplexity, or Qwen — no static question banks. Groq and Qwen use <code className="text-xs bg-slate-100 px-1 rounded">response_format: json_object</code> for schema enforcement. A <code className="text-xs bg-slate-100 px-1 rounded">safeJsonParse</code> layer sanitizes bare control characters.
              </FeatCard>

              <FeatCard icon={FileText} iconBg="bg-blue-100" iconColor="text-blue-600" title="Official Exam Blueprint Integration" borderColor="border-slate-100">
                Topic weights sourced directly from Splunk exam PDFs — enforced at generation time and overridden by adaptive weighting when your profile has enough sessions. Each cert card shows questions, time limit, passing score, level, and per-topic percentages.
              </FeatCard>

              <FeatCard icon={Users} iconBg="bg-cyan-100" iconColor="text-cyan-600" title="Community Difficulty Heatmap" borderColor="border-slate-100">
                Anonymized error rates from all users aggregated in D1's <code className="text-xs bg-slate-100 px-1 rounded">community_stats</code> table and displayed per topic on each cert card — showing which topics the community finds hardest before you start.
              </FeatCard>

              <FeatCard icon={Globe} iconBg="bg-rose-100" iconColor="text-rose-600" title="Live Web Search Mode" borderColor="border-slate-100">
                Switch to the Perplexity engine to ground questions in live Splunk documentation searches — ideal for keeping up with latest product changes beyond the RAG index's ingestion date.
              </FeatCard>

              <FeatCard icon={Shield} iconBg="bg-slate-100" iconColor="text-slate-600" title="Dual-Signal Usage Rate Limiting" borderColor="border-slate-100">
                Shared-key users limited to 10 free exams per day, tracked by both userId and hashed IP. Either signal hitting the limit blocks the session — incognito or localStorage clearing won't bypass it. Own-key users bypass all limits.
              </FeatCard>

            </div>
          </section>

          {/* ── Agentic Architecture (original vertical stepper) ── */}
          <section>
            <h2 className="text-xl font-extrabold text-slate-800 mb-1">Agentic AI Architecture</h2>
            <p className="text-slate-500 text-sm mb-5">How the six agents and three layers collaborate on every exam generation.</p>

            <div className="relative">
              {/* Vertical connector line */}
              <div className="absolute left-6 top-10 bottom-10 w-0.5 bg-gradient-to-b from-purple-200 via-teal-200 via-orange-200 to-indigo-200 hidden md:block" />

              <div className="space-y-4">

                {/* Trigger */}
                <div className="flex gap-4 items-start">
                  <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center flex-shrink-0 z-10 shadow-lg">
                    <Settings className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-grow bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                    <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
                      <h4 className="font-semibold text-slate-800 text-sm">User configures exam</h4>
                      <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-mono">trigger</span>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">Selects cert, question count, topics, provider. Adaptive context is read from D1 and merged with blueprint weights before generation starts. Usage limit is checked for shared-key users (userId + IP).</p>
                  </div>
                </div>

                <div className="flex gap-4 items-center ml-5">
                  <div className="w-2 h-2 rounded-full bg-teal-400 z-10 flex-shrink-0" />
                  <div className="text-xs text-teal-600 font-semibold">Layer 2 — 3-step RAG retrieval + cross-session dedup fetch (parallel)</div>
                </div>

                {/* Layer 2 */}
                <div className="flex gap-4 items-start">
                  <div className="w-12 h-12 rounded-full bg-teal-500 flex items-center justify-center flex-shrink-0 z-10 shadow-lg">
                    <BookOpen className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-grow bg-white border-2 border-teal-200 rounded-xl p-4 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 text-xs font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-bl-lg border-l border-b border-teal-200">Layer 2 · RAG Agent + Dedup</div>
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h4 className="font-semibold text-slate-800 text-sm">Retrieve → Rerank → Inject + Load Seen Concepts</h4>
                      <span className="text-xs bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full font-mono border border-teal-200">Vectorize + Jina v3 + D1</span>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed mb-2">
                      <strong className="font-medium text-slate-600">RAG Step 1:</strong> Embeds the exam query via <code className="bg-slate-100 px-1 rounded">bge-small-en-v1.5</code>, fetches up to 15 candidates from Vectorize (cosine ≥ 0.5, cert-filtered first). <strong className="font-medium text-slate-600">Step 2:</strong> Jina Reranker v3 re-scores all candidates with an 8s timeout — falls back to Vectorize top-5 if Jina fails. <strong className="font-medium text-slate-600">Step 3:</strong> The 5 highest-ranked passages are injected. <strong className="font-medium text-slate-600">Dedup (parallel):</strong> Last 50 seen concept hints fetched from D1's <code className="bg-slate-100 px-1 rounded">seen_concepts</code> table simultaneously — zero added latency.
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {['384-dim embeddings', 'cosine ≥ 0.5', 'Jina reranker v3', 'top-5 injected', '50 seen concepts injected', 'graceful fallback'].map(t => (
                        <span key={t} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{t}</span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 items-center ml-5">
                  <div className="w-2 h-2 rounded-full bg-pink-400 z-10 flex-shrink-0" />
                  <div className="text-xs text-pink-600 font-semibold">doc passages + seen concepts + adaptive context injected → LLM generates</div>
                </div>

                {/* Generation */}
                <div className="flex gap-4 items-start">
                  <div className="w-12 h-12 rounded-full bg-pink-500 flex items-center justify-center flex-shrink-0 z-10 shadow-lg">
                    <Zap className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-grow bg-white border-2 border-pink-200 rounded-xl p-4 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 text-xs font-bold text-pink-700 bg-pink-50 px-2 py-0.5 rounded-bl-lg border-l border-b border-pink-200">Generation</div>
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h4 className="font-semibold text-slate-800 text-sm">AI Question Generator</h4>
                      <span className="text-xs bg-pink-50 text-pink-700 px-2 py-0.5 rounded-full font-mono border border-pink-200">Groq / Gemini / Perplexity / Qwen</span>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed mb-2">Generates questions grounded in RAG passages with blueprint topic distribution, adaptive weighting, difficulty calibration, strict topic boundary rules, and cross-session duplicate exclusions. Post-generation, <code className="bg-slate-100 px-1 rounded">filterDocSources</code> strips any <code className="bg-slate-100 px-1 rounded">docSource</code> URL not present in the injected passages.</p>
                    <div className="flex flex-wrap gap-1.5">
                      {['JSON schema enforced', 'adaptive prompt weighting', 'dedup exclusions injected', 'hallucinated URL filter', 'token-scaled output'].map(t => (
                        <span key={t} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{t}</span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 items-center ml-5">
                  <div className="w-2 h-2 rounded-full bg-purple-400 z-10 flex-shrink-0" />
                  <div className="text-xs text-purple-600 font-semibold">raw questions → Layer 1 validation pipeline</div>
                </div>

                {/* Layer 1 */}
                <div className="flex gap-4 items-start">
                  <div className="w-12 h-12 rounded-full bg-purple-500 flex items-center justify-center flex-shrink-0 z-10 shadow-lg">
                    <ShieldCheck className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-grow bg-white border-2 border-purple-200 rounded-xl p-4 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 text-xs font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-bl-lg border-l border-b border-purple-200">Layer 1 · Validator</div>
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h4 className="font-semibold text-slate-800 text-sm">Self-Validation &amp; Refinement Agent</h4>
                      <span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full font-mono border border-purple-200">Groq Llama 3.3</span>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed mb-2">Checks all questions against 6 rules (answer-option exact match, no duplicates, parallel options, no forbidden phrases, difficulty calibration, question integrity). Failures above 10% trigger targeted regeneration. Max 4 cycles for own-key users; 1 cycle for shared-key. Per-cycle failure rates logged and passed to Layer 3.</p>
                    <div className="grid grid-cols-2 gap-1.5">
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
                  <div className="w-2 h-2 rounded-full bg-orange-400 z-10 flex-shrink-0" />
                  <div className="text-xs text-orange-600 font-semibold">exam runs → results + Layer 3 profile update + seen concepts saved + trace persisted</div>
                </div>

                {/* Layer 3 */}
                <div className="flex gap-4 items-start">
                  <div className="w-12 h-12 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0 z-10 shadow-lg">
                    <BarChart2 className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-grow bg-white border-2 border-orange-200 rounded-xl p-4 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 text-xs font-bold text-orange-700 bg-orange-50 px-2 py-0.5 rounded-bl-lg border-l border-b border-orange-200">Layer 3 · Adaptive + Post-exam writes</div>
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h4 className="font-semibold text-slate-800 text-sm">Adaptive Learning Agent</h4>
                      <span className="text-xs bg-orange-50 text-orange-700 px-2 py-0.5 rounded-full font-mono border border-orange-200">Cloudflare D1</span>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed mb-2">After each session, writes per-topic error rates, trend signals, and Layer 1 validation failure rates to D1. Also writes anonymized stats to <code className="bg-slate-100 px-1 rounded">community_stats</code>, persists missed questions to <code className="bg-slate-100 px-1 rounded">wrong_answers</code> with spaced repetition scheduling, saves all question stems to <code className="bg-slate-100 px-1 rounded">seen_concepts</code> for future dedup, and writes a full generation trace to <code className="bg-slate-100 px-1 rounded">generation_traces</code>. On the next exam, topics with &gt;60% error rate get 1.8× allocation.</p>
                    <div className="flex flex-wrap gap-1.5">
                      {['error rate + trend tracking', 'L1 validation failure rates', 'community stats (anonymized)', 'spaced repetition scheduling', 'seen concepts (dedup)', 'generation trace (observability)'].map(t => (
                        <span key={t} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{t}</span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 items-center ml-5">
                  <div className="w-2 h-2 rounded-full bg-indigo-400 z-10 flex-shrink-0" />
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
                      <h4 className="font-semibold text-slate-800 text-sm">RAG-Grounded Depth-Escalating Explainer</h4>
                      <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-mono border border-indigo-200">Groq Llama 3.3 + Vectorize</span>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed mb-2">Activates lazily when a user clicks <span className="font-semibold text-indigo-600">Why?</span> on a wrong answer. Runs its own independent RAG retrieval for that topic, then injects the passage into the explanation prompt. Reads <code className="bg-slate-100 px-1 rounded">times_missed</code> from D1 and chooses depth: basic (1×) → detailed (2×) → first-principles with analogy (3×+). The "Open Docs" link resolves from the RAG-retrieved URL — stale generation-time sources are discarded.</p>
                    <div className="flex flex-wrap gap-1.5">
                      {['1× → basic', '2× → detailed', '3× → deep + analogy', 'RAG URL wins over stale source'].map(t => (
                        <span key={t} className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-100">{t}</span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Cross-layer callout */}
                <div className="ml-16 flex items-start gap-3 bg-gradient-to-r from-purple-50 to-orange-50 border border-purple-100 rounded-xl px-4 py-3">
                  <RefreshCw className="w-4 h-4 text-purple-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-600 leading-relaxed">
                    <span className="font-semibold text-purple-700">Cross-layer feedback loop:</span> Layer 1 validation failure rates per topic are stored in Layer 3's adaptive profile and re-injected as generation quality warnings on every subsequent prompt. Seen concepts from Layer 3 feed back into Layer 2's prompt as hard exclusions. The Jina reranker's graceful fallback ensures Layer 2 never blocks exam generation. Every generation run writes a full trace to D1 for observability.
                  </p>
                </div>

              </div>
            </div>
          </section>

          {/* ── How to Use ── */}
          <section>
            <h2 className="text-xl font-extrabold text-slate-800 mb-1">How to Use This Tool</h2>
            <p className="text-slate-500 text-sm mb-5">Four steps — the system wires everything else automatically.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                {
                  n: '1', numBg: 'bg-pink-100', numText: 'text-pink-700',
                  title: 'Pick a certification',
                  bullets: [
                    'Choose your Splunk exam track',
                    'Community heatmap shows which topics others find hardest',
                    'Blueprint shows official topic weights and passing score',
                  ],
                },
                {
                  n: '2', numBg: 'bg-purple-100', numText: 'text-purple-700',
                  title: 'Configure your exam',
                  bullets: [
                    'Set question count and topic focus',
                    'Toggle the timer on or off',
                    'Pick AI engine — Groq, Gemini, Perplexity, or Qwen',
                  ],
                },
                {
                  n: '3', numBg: 'bg-teal-100', numText: 'text-teal-700',
                  title: 'Take the exam',
                  bullets: [
                    'Every set is unique — dedup agent prevents concept repeats',
                    'Flag questions and use the navigator to jump around',
                    'Submit when ready',
                  ],
                },
                {
                  n: '4', numBg: 'bg-emerald-100', numText: 'text-emerald-700',
                  title: 'Review & improve',
                  bullets: [
                    'Click "Why?" on any wrong answer for a grounded explanation',
                    'Launch a spaced repetition review session',
                    'Adaptive profile reweights your next exam automatically',
                  ],
                },
              ].map(({ n, numBg, numText, title, bullets }) => (
                <div key={n} className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex flex-col gap-3">
                  <div className={`w-8 h-8 ${numBg} ${numText} font-bold text-sm flex items-center justify-center rounded-full flex-shrink-0`}>
                    {n}
                  </div>
                  <h4 className="font-semibold text-slate-800 text-sm leading-snug">{title}</h4>
                  <ul className="space-y-2">
                    {bullets.map(b => (
                      <li key={b} className="flex gap-2 items-start">
                        <span className="w-1 h-1 rounded-full bg-slate-300 flex-shrink-0 mt-1.5" />
                        <span className="text-xs text-slate-500 leading-relaxed">{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          {/* Attribution */}
          <p className="text-center text-xs text-slate-400 pb-2">
            Not affiliated with or endorsed by Splunk Inc.
          </p>

        </div>
      </div>
    </div>
  );
}
