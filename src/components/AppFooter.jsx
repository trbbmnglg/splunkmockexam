import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

/* ─────────────────────────────────────────────
   Section toggle wrapper
───────────────────────────────────────────── */
function Section({ title, subtitle, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 bg-white text-left hover:bg-slate-50 transition-colors"
      >
        <div>
          <div className="font-semibold text-slate-800 text-base">{title}</div>
          {subtitle && <div className="text-xs text-slate-500 mt-0.5">{subtitle}</div>}
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-400 flex-shrink-0 ml-4 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="border-t border-slate-100 bg-slate-50 p-4">
          {children}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Feature card
───────────────────────────────────────────── */
function FeatCard({ emoji, iconBg, name, badge, badgeStyle, teaser, chips }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm flex-shrink-0 ${iconBg}`}>
          {emoji}
        </div>
        <span className="text-sm font-semibold text-slate-800 leading-tight flex-grow">{name}</span>
        {badge && (
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border flex-shrink-0 ${badgeStyle}`}>
            {badge}
          </span>
        )}
      </div>
      <p className="text-xs text-slate-500 leading-relaxed">{teaser}</p>
      {chips?.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {chips.map(c => (
            <span key={c} className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full border border-slate-200">
              {c}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   How-to card
───────────────────────────────────────────── */
function HowCard({ n, numStyle, title, bullets }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col gap-3">
      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 ${numStyle}`}>
        {n}
      </div>
      <div className="font-semibold text-slate-800 text-sm">{title}</div>
      <ul className="space-y-2">
        {bullets.map(b => (
          <li key={b} className="flex gap-2 items-start">
            <span className="w-1 h-1 rounded-full bg-slate-300 flex-shrink-0 mt-1.5" />
            <span className="text-xs text-slate-500 leading-relaxed">{b}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Agentic Architecture SVG diagram
───────────────────────────────────────────── */
function AgentDiagram() {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3 overflow-x-auto">
      <svg width="100%" viewBox="0 0 680 860" xmlns="http://www.w3.org/2000/svg"
        style={{ fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif', minWidth: '480px' }}>
        <defs>
          <marker id="af-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M2 1L8 5L2 9" fill="none" stroke="context-stroke" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </marker>
        </defs>

        {/* ── ZONE 0: USER TRIGGER ── */}
        <rect x="20" y="20" width="640" height="68" rx="10" fill="none" stroke="#B4B2A9" strokeWidth="0.5" strokeDasharray="4 3"/>
        <text fontSize="11" fill="#888780" x="36" y="38">user trigger</text>

        {/* adaptive profile */}
        <rect x="40" y="44" width="172" height="36" rx="6" fill="#F1EFE8" stroke="#B4B2A9" strokeWidth="0.5"/>
        <text fontSize="12" fontWeight="500" fill="#444441" x="126" y="66" textAnchor="middle">Adaptive profile</text>

        {/* blueprint weights */}
        <rect x="228" y="44" width="172" height="36" rx="6" fill="#F1EFE8" stroke="#B4B2A9" strokeWidth="0.5"/>
        <text fontSize="12" fontWeight="500" fill="#444441" x="314" y="66" textAnchor="middle">Blueprint weights</text>

        {/* usage check */}
        <rect x="416" y="44" width="224" height="36" rx="6" fill="#F1EFE8" stroke="#B4B2A9" strokeWidth="0.5"/>
        <text fontSize="12" fontWeight="500" fill="#444441" x="528" y="66" textAnchor="middle">Usage check (userId + IP)</text>

        {/* down arrow */}
        <line x1="340" y1="88" x2="340" y2="108" stroke="#B4B2A9" strokeWidth="1" markerEnd="url(#af-arrow)"/>

        {/* ── ZONE 1: PRE-GENERATION ── */}
        <rect x="20" y="112" width="640" height="150" rx="10" fill="none" stroke="#5DCAA5" strokeWidth="0.5" strokeDasharray="4 3"/>
        <text fontSize="11" fill="#0F6E56" x="36" y="130">pre-generation — parallel fetch</text>

        {/* RAG row */}
        <rect x="40" y="138" width="120" height="52" rx="6" fill="#E1F5EE" stroke="#5DCAA5" strokeWidth="0.5"/>
        <text fontSize="12" fontWeight="500" fill="#085041" x="100" y="157" textAnchor="middle">Embed query</text>
        <text fontSize="11" fill="#0F6E56" x="100" y="174" textAnchor="middle">bge-small-en-v1.5</text>

        <line x1="160" y1="164" x2="176" y2="164" stroke="#1D9E75" strokeWidth="1" markerEnd="url(#af-arrow)"/>

        <rect x="176" y="138" width="120" height="52" rx="6" fill="#E1F5EE" stroke="#5DCAA5" strokeWidth="0.5"/>
        <text fontSize="12" fontWeight="500" fill="#085041" x="236" y="157" textAnchor="middle">Vectorize</text>
        <text fontSize="11" fill="#0F6E56" x="236" y="174" textAnchor="middle">15 cands · cos ≥ 0.5</text>

        <line x1="296" y1="164" x2="312" y2="164" stroke="#1D9E75" strokeWidth="1" markerEnd="url(#af-arrow)"/>

        <rect x="312" y="138" width="128" height="52" rx="6" fill="#E1F5EE" stroke="#5DCAA5" strokeWidth="0.5"/>
        <text fontSize="12" fontWeight="500" fill="#085041" x="376" y="157" textAnchor="middle">Jina Reranker v3</text>
        <text fontSize="11" fill="#0F6E56" x="376" y="174" textAnchor="middle">top-5 passages</text>

        <line x1="440" y1="164" x2="456" y2="164" stroke="#1D9E75" strokeWidth="1" markerEnd="url(#af-arrow)"/>

        <rect x="456" y="138" width="172" height="52" rx="6" fill="#E1F5EE" stroke="#5DCAA5" strokeWidth="0.5"/>
        <text fontSize="12" fontWeight="500" fill="#085041" x="542" y="157" textAnchor="middle">RAG context ready</text>
        <text fontSize="11" fill="#0F6E56" x="542" y="174" textAnchor="middle">5 doc passages injected</text>

        {/* Dedup row (parallel) */}
        <text fontSize="11" fill="#888780" x="44" y="216">parallel</text>

        <rect x="82" y="204" width="164" height="44" rx="6" fill="#E1F5EE" stroke="#5DCAA5" strokeWidth="0.5"/>
        <text fontSize="12" fontWeight="500" fill="#085041" x="164" y="222" textAnchor="middle">Fetch seen concepts</text>
        <text fontSize="11" fill="#0F6E56" x="164" y="238" textAnchor="middle">last 50 hints from D1</text>

        <line x1="246" y1="226" x2="456" y2="226" stroke="#1D9E75" strokeWidth="1" strokeDasharray="3 3" markerEnd="url(#af-arrow)"/>

        <rect x="456" y="204" width="172" height="44" rx="6" fill="#E1F5EE" stroke="#5DCAA5" strokeWidth="0.5"/>
        <text fontSize="12" fontWeight="500" fill="#085041" x="542" y="222" textAnchor="middle">Dedup hints ready</text>
        <text fontSize="11" fill="#0F6E56" x="542" y="238" textAnchor="middle">grouped by topic</text>

        {/* down arrow */}
        <line x1="340" y1="262" x2="340" y2="282" stroke="#B4B2A9" strokeWidth="1" markerEnd="url(#af-arrow)"/>

        {/* ── ZONE 2: GENERATION LOOP ── */}
        <rect x="20" y="286" width="640" height="196" rx="10" fill="none" stroke="#AFA9EC" strokeWidth="0.5" strokeDasharray="4 3"/>
        <text fontSize="11" fill="#534AB7" x="36" y="304">generation loop</text>

        {/* Generator */}
        <rect x="40" y="312" width="240" height="62" rx="6" fill="#EEEDFE" stroke="#AFA9EC" strokeWidth="0.5"/>
        <text fontSize="12" fontWeight="500" fill="#26215C" x="160" y="336" textAnchor="middle">AI Question Generator</text>
        <text fontSize="11" fill="#534AB7" x="160" y="356" textAnchor="middle">RAG + dedup + adaptive weights</text>

        <line x1="280" y1="343" x2="300" y2="343" stroke="#534AB7" strokeWidth="1" markerEnd="url(#af-arrow)"/>

        {/* Validator */}
        <rect x="300" y="312" width="212" height="62" rx="6" fill="#EEEDFE" stroke="#AFA9EC" strokeWidth="0.5"/>
        <text fontSize="12" fontWeight="500" fill="#26215C" x="406" y="330" textAnchor="middle">Layer 1 — Validator</text>
        <text fontSize="11" fill="#534AB7" x="406" y="347" textAnchor="middle">6 rules · 10% threshold</text>
        <text fontSize="11" fill="#534AB7" x="406" y="363" textAnchor="middle">max 4 cycles (own key)</text>

        <line x1="512" y1="343" x2="528" y2="343" stroke="#534AB7" strokeWidth="1" markerEnd="url(#af-arrow)"/>

        {/* URL Filter */}
        <rect x="528" y="312" width="112" height="62" rx="6" fill="#EEEDFE" stroke="#AFA9EC" strokeWidth="0.5"/>
        <text fontSize="12" fontWeight="500" fill="#26215C" x="584" y="330" textAnchor="middle">URL filter</text>
        <text fontSize="11" fill="#534AB7" x="584" y="347" textAnchor="middle">strips ungrounded</text>
        <text fontSize="11" fill="#534AB7" x="584" y="363" textAnchor="middle">docSource links</text>

        {/* Retry loop */}
        <path d="M406 374 L406 428 L160 428 L160 374" fill="none" stroke="#7F77DD" strokeWidth="1" strokeDasharray="4 3" markerEnd="url(#af-arrow)"/>
        <text fontSize="11" fill="#534AB7" x="283" y="422" textAnchor="middle">retry on failure</text>

        {/* Failure rate feedback label */}
        <text fontSize="11" fill="#534AB7" x="406" y="454" textAnchor="middle">failure rates → Layer 3</text>
        <line x1="406" y1="458" x2="406" y2="468" stroke="#7F77DD" strokeWidth="0.5" strokeDasharray="2 2"/>

        {/* down arrow */}
        <line x1="340" y1="482" x2="340" y2="504" stroke="#B4B2A9" strokeWidth="1" markerEnd="url(#af-arrow)"/>
        <text fontSize="11" fill="#888780" x="348" y="496">exam runs</text>

        {/* ── ZONE 3: POST-EXAM ── */}
        <rect x="20" y="508" width="640" height="196" rx="10" fill="none" stroke="#EF9F27" strokeWidth="0.5" strokeDasharray="4 3"/>
        <text fontSize="11" fill="#854F0B" x="36" y="526">post-exam — parallel writes (fire-and-forget)</text>

        {/* Layer 3 hub */}
        <rect x="258" y="534" width="164" height="44" rx="6" fill="#FAEEDA" stroke="#EF9F27" strokeWidth="0.5"/>
        <text fontSize="12" fontWeight="500" fill="#412402" x="340" y="552" textAnchor="middle">Layer 3 — Adaptive</text>
        <text fontSize="11" fill="#854F0B" x="340" y="568" textAnchor="middle">results processed</text>

        {/* Fan-out arrows */}
        <line x1="270" y1="578" x2="126" y2="614" stroke="#BA7517" strokeWidth="0.8" markerEnd="url(#af-arrow)"/>
        <line x1="300" y1="578" x2="252" y2="614" stroke="#BA7517" strokeWidth="0.8" markerEnd="url(#af-arrow)"/>
        <line x1="340" y1="578" x2="340" y2="614" stroke="#BA7517" strokeWidth="0.8" markerEnd="url(#af-arrow)"/>
        <line x1="380" y1="578" x2="428" y2="614" stroke="#BA7517" strokeWidth="0.8" markerEnd="url(#af-arrow)"/>
        <line x1="410" y1="578" x2="546" y2="614" stroke="#BA7517" strokeWidth="0.8" markerEnd="url(#af-arrow)"/>

        {/* 5 D1 write targets */}
        <rect x="40" y="614" width="172" height="40" rx="6" fill="#FAEEDA" stroke="#EF9F27" strokeWidth="0.5"/>
        <text fontSize="12" fontWeight="500" fill="#412402" x="126" y="630" textAnchor="middle">topic_profiles</text>
        <text fontSize="11" fill="#854F0B" x="126" y="646" textAnchor="middle">error rates + trends</text>

        <rect x="220" y="614" width="128" height="40" rx="6" fill="#FAEEDA" stroke="#EF9F27" strokeWidth="0.5"/>
        <text fontSize="12" fontWeight="500" fill="#412402" x="284" y="630" textAnchor="middle">community_stats</text>
        <text fontSize="11" fill="#854F0B" x="284" y="646" textAnchor="middle">anonymized</text>

        <rect x="308" y="614" width="128" height="40" rx="6" fill="#FAEEDA" stroke="#EF9F27" strokeWidth="0.5"/>
        <text fontSize="12" fontWeight="500" fill="#412402" x="372" y="630" textAnchor="middle">wrong_answers</text>
        <text fontSize="11" fill="#854F0B" x="372" y="646" textAnchor="middle">spaced rep schedule</text>

        <rect x="396" y="614" width="128" height="40" rx="6" fill="#FAEEDA" stroke="#EF9F27" strokeWidth="0.5"/>
        <text fontSize="12" fontWeight="500" fill="#412402" x="460" y="630" textAnchor="middle">seen_concepts</text>
        <text fontSize="11" fill="#854F0B" x="460" y="646" textAnchor="middle">dedup hashes</text>

        <rect x="484" y="614" width="156" height="40" rx="6" fill="#FAEEDA" stroke="#EF9F27" strokeWidth="0.5"/>
        <text fontSize="12" fontWeight="500" fill="#412402" x="562" y="630" textAnchor="middle">generation_traces</text>
        <text fontSize="11" fill="#854F0B" x="562" y="646" textAnchor="middle">observability log</text>

        {/* Feedback: seen_concepts → pre-gen (next session) */}
        <path d="M20 658 L8 658 L8 170 L40 170" fill="none" stroke="#1D9E75" strokeWidth="0.8" strokeDasharray="3 3" markerEnd="url(#af-arrow)"/>
        <text fontSize="10" fill="#0F6E56" x="44" y="186">next session</text>

        {/* Feedback: topic_profiles → trigger zone */}
        <path d="M126 614 L126 548 L20 548 L20 62 L40 62" fill="none" stroke="#888780" strokeWidth="0.8" strokeDasharray="3 3" markerEnd="url(#af-arrow)"/>

        {/* down arrow to explainer */}
        <line x1="340" y1="704" x2="340" y2="724" stroke="#B4B2A9" strokeWidth="0.5" strokeDasharray="3 3"/>
        <text fontSize="11" fill="#888780" x="348" y="716">wrong answers</text>

        {/* ── ZONE 4: ON-DEMAND EXPLAINER ── */}
        <rect x="20" y="728" width="640" height="112" rx="10" fill="none" stroke="#85B7EB" strokeWidth="0.5" strokeDasharray="4 3"/>
        <text fontSize="11" fill="#185FA5" x="36" y="746">on-demand — lazy trigger (user clicks "Why?")</text>

        <rect x="40" y="754" width="172" height="52" rx="6" fill="#E6F1FB" stroke="#85B7EB" strokeWidth="0.5"/>
        <text fontSize="12" fontWeight="500" fill="#042C53" x="126" y="773" textAnchor="middle">RAG retrieval</text>
        <text fontSize="11" fill="#185FA5" x="126" y="790" textAnchor="middle">per wrong answer</text>

        <line x1="212" y1="780" x2="232" y2="780" stroke="#185FA5" strokeWidth="1" markerEnd="url(#af-arrow)"/>

        <rect x="232" y="754" width="172" height="52" rx="6" fill="#E6F1FB" stroke="#85B7EB" strokeWidth="0.5"/>
        <text fontSize="12" fontWeight="500" fill="#042C53" x="318" y="773" textAnchor="middle">Depth selector</text>
        <text fontSize="11" fill="#185FA5" x="318" y="790" textAnchor="middle">times_missed from D1</text>

        <line x1="404" y1="780" x2="424" y2="780" stroke="#185FA5" strokeWidth="1" markerEnd="url(#af-arrow)"/>

        <rect x="424" y="754" width="236" height="52" rx="6" fill="#E6F1FB" stroke="#85B7EB" strokeWidth="0.5"/>
        <text fontSize="12" fontWeight="500" fill="#042C53" x="542" y="769" textAnchor="middle">Explanation output</text>
        <text fontSize="11" fill="#185FA5" x="542" y="785" textAnchor="middle">1× basic · 2× detailed</text>
        <text fontSize="11" fill="#185FA5" x="542" y="800" textAnchor="middle">3× first-principles + analogy</text>

        {/* Legend */}
        <rect x="20" y="852" width="12" height="3" rx="1" fill="#5DCAA5"/>
        <text fontSize="11" fill="#888780" x="38" y="857">teal = retrieval</text>
        <rect x="130" y="852" width="12" height="3" rx="1" fill="#7F77DD"/>
        <text fontSize="11" fill="#888780" x="148" y="857">purple = generation</text>
        <rect x="278" y="852" width="12" height="3" rx="1" fill="#EF9F27"/>
        <text fontSize="11" fill="#888780" x="296" y="857">amber = adaptive writes</text>
        <rect x="440" y="852" width="12" height="3" rx="1" fill="#378ADD"/>
        <text fontSize="11" fill="#888780" x="458" y="857">blue = on-demand</text>
        <line x1="558" y1="855" x2="574" y2="855" stroke="#888780" strokeWidth="1" strokeDasharray="3 2"/>
        <text fontSize="11" fill="#888780" x="580" y="859">feedback loop</text>
      </svg>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Main footer
───────────────────────────────────────────── */
export default function AppFooter({ gameState }) {
  if (gameState !== 'menu' && gameState !== 'results') return null;

  return (
    <footer className="max-w-6xl mx-auto px-4 py-12 mt-12 border-t border-slate-200 space-y-4">

      {/* ── Features & Benefits ── */}
      <Section
        title="Features & Benefits"
        subtitle="16 agentic features — scan the chips for what each one does"
        defaultOpen={true}
      >
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">

          <FeatCard
            emoji="🛡" iconBg="bg-purple-100"
            name="Self-Validation Pipeline"
            badge="Layer 1" badgeStyle="bg-purple-50 border-purple-200 text-purple-700"
            teaser="A secondary Groq agent reviews every question against 6 rules and triggers targeted regeneration on failures."
            chips={['6 quality rules', '10% threshold', 'max 4 cycles (own key)', '1 cycle (shared key)']}
          />
          <FeatCard
            emoji="📚" iconBg="bg-teal-100"
            name="3-Step RAG Pipeline"
            badge="Layer 2" badgeStyle="bg-teal-50 border-teal-200 text-teal-700"
            teaser="Embed → Vectorize (15 candidates) → Jina Reranker v3 → top-5 passages injected into every prompt."
            chips={['bge-small-en-v1.5', 'cosine ≥ 0.5', 'Jina v3 · 8s timeout', 'graceful fallback']}
          />
          <FeatCard
            emoji="📊" iconBg="bg-orange-100"
            name="Adaptive Learning Agent"
            badge="Layer 3" badgeStyle="bg-orange-50 border-orange-200 text-orange-700"
            teaser="Per-topic error rates reweight question distribution each session. Weak topics get 1.8× allocation."
            chips={['>60% error → 1.8×', 'D1 persisted', 'rolling 7-session trend']}
          />
          <FeatCard
            emoji="✦" iconBg="bg-indigo-100"
            name="RAG-Grounded Explainer"
            badge="on-demand" badgeStyle="bg-indigo-50 border-indigo-200 text-indigo-700"
            teaser="Independent RAG retrieval per wrong answer. Depth escalates automatically with times_missed from D1."
            chips={['1× basic', '2× detailed', '3× first-principles + analogy', 'RAG URL overrides stale source']}
          />
          <FeatCard
            emoji="🔁" iconBg="bg-pink-100"
            name="Spaced Repetition"
            badge="review" badgeStyle="bg-pink-50 border-pink-200 text-pink-700"
            teaser="Missed questions are scheduled for review on a 1→3→7→14→30→60 day interval stored in D1."
            chips={['6 intervals', 'D1 wrong_answers', 'hash-matched delete after review']}
          />
          <FeatCard
            emoji="⊘" iconBg="bg-cyan-100"
            name="Cross-Session Dedup"
            badge="per-session" badgeStyle="bg-cyan-50 border-cyan-200 text-cyan-700"
            teaser="Seen concept hashes saved to D1 after every exam. Last 50 hints injected as hard exclusions before generation."
            chips={['100 cap/cert', 'parallel fetch', 'grouped by topic']}
          />
          <FeatCard
            emoji="↩" iconBg="bg-slate-100"
            name="L1 → L3 Feedback Loop"
            badge="cross-layer" badgeStyle="bg-slate-100 border-slate-200 text-slate-600"
            teaser="Layer 1 validation failure rates per topic are stored in Layer 3 and re-injected as generation quality warnings."
            chips={['failure rates → adaptive profile', 'per-topic warnings']}
          />
          <FeatCard
            emoji="🗄" iconBg="bg-violet-100"
            name="Agent Trace Persistence"
            badge="observability" badgeStyle="bg-violet-50 border-violet-200 text-violet-700"
            teaser="Every generation run writes a full trace to D1: provider, latency, tokens, retry count, validation cycles, RAG passage count."
            chips={['generation_traces table', 'latency', 'token counts', 'retry + cycle log']}
          />
          <FeatCard
            emoji="🚫" iconBg="bg-emerald-100"
            name="Hallucinated URL Filter"
            badge="post-generation" badgeStyle="bg-emerald-50 border-emerald-200 text-emerald-700"
            teaser="filterDocSources strips any docSource URL not present in the injected RAG passages after every generation."
            chips={['strips ungrounded URLs', 'falls back to explainer RAG']}
          />
          <FeatCard
            emoji="⚡" iconBg="bg-yellow-100"
            name="Multi-Provider AI"
            teaser="Fresh questions every session via Groq, Gemini, Perplexity, or Qwen — no static question banks."
            chips={['JSON schema enforced', 'safeJsonParse', 'token-scaled output']}
          />
          <FeatCard
            emoji="📋" iconBg="bg-blue-100"
            name="Official Blueprint Integration"
            teaser="Topic weights sourced directly from Splunk exam PDFs — enforced at generation time, overridden by adaptive weighting."
            chips={['per-cert blueprints', 'topic weight %', 'adaptive override']}
          />
          <FeatCard
            emoji="👥" iconBg="bg-rose-100"
            name="Community Difficulty Heatmap"
            teaser="Anonymized error rates from all users are aggregated and displayed per topic on each cert card."
            chips={['community_stats D1', 'anonymized', 'per-topic']}
          />
          <FeatCard
            emoji="🌐" iconBg="bg-sky-100"
            name="Live Web Search Mode"
            teaser="Switch to Perplexity to ground questions in live Splunk doc searches beyond the RAG index's ingestion date."
            chips={['Perplexity engine', 'live search']}
          />
          <FeatCard
            emoji="🔒" iconBg="bg-slate-100"
            name="Dual-Signal Rate Limiting"
            teaser="Shared-key users are limited by both userId and hashed IP — incognito or localStorage clearing won't bypass it."
            chips={['10 exams/day', 'userId + hashed IP', 'own-key bypasses']}
          />

        </div>
      </Section>

      {/* ── Agentic Architecture ── */}
      <Section
        title="Agentic architecture"
        subtitle="Four zones — parallel fetches, a generation loop, fan-out writes, and a lazy explainer"
      >
        <AgentDiagram />
      </Section>

      {/* ── How to Use ── */}
      <Section
        title="How to use"
        subtitle="Four steps — the system handles everything else automatically"
      >
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <HowCard
            n="1" numStyle="bg-pink-100 text-pink-800"
            title="Pick a certification"
            bullets={[
              'Choose your Splunk exam track',
              'Community heatmap shows which topics the community finds hardest',
              'Blueprint link shows official topic weights and passing score',
            ]}
          />
          <HowCard
            n="2" numStyle="bg-purple-100 text-purple-800"
            title="Configure your exam"
            bullets={[
              'Set question count and topic focus',
              'Toggle the timer on or off',
              'Pick AI engine — Groq, Gemini, Perplexity, or Qwen',
            ]}
          />
          <HowCard
            n="3" numStyle="bg-teal-100 text-teal-800"
            title="Take the exam"
            bullets={[
              'Every set is unique — dedup agent prevents concept repeats across sessions',
              'Flag questions and use the navigator to jump around',
              'Submit when ready',
            ]}
          />
          <HowCard
            n="4" numStyle="bg-emerald-100 text-emerald-800"
            title="Review & improve"
            bullets={[
              'Click "Why?" on any wrong answer for a RAG-grounded explanation',
              'Launch a spaced repetition review session for missed questions',
              'Adaptive profile reweights your next exam automatically',
            ]}
          />
        </div>
      </Section>

      {/* ── Attribution ── */}
      <p className="text-center text-xs text-slate-400 pt-2">
        Not affiliated with or endorsed by Splunk Inc.
      </p>

    </footer>
  );
}
