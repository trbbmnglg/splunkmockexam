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
   Feature card — icon · name · badge · teaser · chips
───────────────────────────────────────────── */
function FeatCard({ emoji, iconBg, name, badge, badgeStyle, teaser, chips }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col gap-3">
      {/* row 1: icon + name + badge */}
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
      {/* row 2: teaser — ONE short sentence max */}
      <p className="text-xs text-slate-500 leading-relaxed">{teaser}</p>
      {/* row 3: chips */}
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
   Arch step — number · title · badge · one-liner · chips
───────────────────────────────────────────── */
function ArchStep({ n, numStyle, title, badge, badgeStyle, desc, chips, last }) {
  return (
    <div className="flex gap-3">
      {/* left: number + connector line */}
      <div className="flex flex-col items-center flex-shrink-0 w-7">
        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 ${numStyle}`}>
          {n}
        </div>
        {!last && <div className="w-px flex-1 bg-slate-200 mt-1" />}
      </div>
      {/* right: content */}
      <div className={`flex-1 ${last ? 'pb-0' : 'pb-4'}`}>
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <span className="text-sm font-semibold text-slate-800">{title}</span>
          {badge && (
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${badgeStyle}`}>
              {badge}
            </span>
          )}
        </div>
        <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
        {chips?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {chips.map(c => (
              <span key={c} className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full border border-slate-200">
                {c}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   How-to card — number · title · bullet list
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
   Main footer
───────────────────────────────────────────── */
export default function AppFooter({ gameState }) {
  if (gameState !== 'menu' && gameState !== 'results') return null;

  return (
    <footer className="max-w-6xl mx-auto px-4 py-12 mt-12 border-t border-slate-200 space-y-4">

      {/* ── 1. Features & Benefits ── */}
      <Section
        title="Features & Benefits"
        subtitle="16 agentic features — scan the chips for what each one does"
        defaultOpen={true}
      >
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">

          <FeatCard
            emoji="🛡"
            iconBg="bg-purple-100"
            name="Self-Validation Pipeline"
            badge="Layer 1"
            badgeStyle="bg-purple-50 border-purple-200 text-purple-700"
            teaser="A secondary Groq agent reviews every question against 6 rules and triggers targeted regeneration on failures."
            chips={['6 quality rules', '10% threshold', 'max 4 cycles (own key)', '1 cycle (shared key)']}
          />

          <FeatCard
            emoji="📚"
            iconBg="bg-teal-100"
            name="3-Step RAG Pipeline"
            badge="Layer 2"
            badgeStyle="bg-teal-50 border-teal-200 text-teal-700"
            teaser="Embed → Vectorize (15 candidates) → Jina Reranker v3 → top-5 passages injected into every prompt."
            chips={['bge-small-en-v1.5', 'cosine ≥ 0.5', 'Jina v3 (8s timeout)', 'graceful fallback']}
          />

          <FeatCard
            emoji="📊"
            iconBg="bg-orange-100"
            name="Adaptive Learning Agent"
            badge="Layer 3"
            badgeStyle="bg-orange-50 border-orange-200 text-orange-700"
            teaser="Per-topic error rates reweight question distribution each session. Weak topics get 1.8× allocation."
            chips={['>60% error → 1.8×', 'D1 persisted', 'rolling 7-session trend']}
          />

          <FeatCard
            emoji="✦"
            iconBg="bg-indigo-100"
            name="RAG-Grounded Explainer"
            badge="on-demand"
            badgeStyle="bg-indigo-50 border-indigo-200 text-indigo-700"
            teaser="Independent RAG retrieval per wrong answer. Depth escalates automatically with times_missed from D1."
            chips={['1× basic', '2× detailed', '3× first-principles + analogy', 'RAG URL overrides stale source']}
          />

          <FeatCard
            emoji="🔁"
            iconBg="bg-pink-100"
            name="Spaced Repetition"
            badge="review"
            badgeStyle="bg-pink-50 border-pink-200 text-pink-700"
            teaser="Missed questions are scheduled for review on a 1→3→7→14→30→60 day interval stored in D1."
            chips={['6 intervals', 'D1 wrong_answers', 'hash-matched delete after review']}
          />

          <FeatCard
            emoji="⊘"
            iconBg="bg-cyan-100"
            name="Cross-Session Dedup"
            badge="per-session"
            badgeStyle="bg-cyan-50 border-cyan-200 text-cyan-700"
            teaser="Seen concept hashes saved to D1 after every exam. Last 50 hints injected as hard exclusions before generation."
            chips={['100 cap/cert', 'parallel fetch', 'grouped by topic']}
          />

          <FeatCard
            emoji="↩"
            iconBg="bg-slate-100"
            name="L1 → L3 Feedback Loop"
            badge="cross-layer"
            badgeStyle="bg-slate-100 border-slate-200 text-slate-600"
            teaser="Layer 1 validation failure rates per topic are stored in Layer 3 and re-injected as generation quality warnings."
            chips={['failure rates → adaptive profile', 'per-topic warnings']}
          />

          <FeatCard
            emoji="🗄"
            iconBg="bg-violet-100"
            name="Agent Trace Persistence"
            badge="observability"
            badgeStyle="bg-violet-50 border-violet-200 text-violet-700"
            teaser="Every generation run writes a full trace to D1: provider, latency, tokens, retry count, validation cycles, RAG passage count."
            chips={['generation_traces table', 'latency', 'token counts', 'retry + cycle log']}
          />

          <FeatCard
            emoji="🚫"
            iconBg="bg-emerald-100"
            name="Hallucinated URL Filter"
            badge="post-generation"
            badgeStyle="bg-emerald-50 border-emerald-200 text-emerald-700"
            teaser="filterDocSources strips any docSource URL not present in the injected RAG passages after every generation."
            chips={['strips ungrounded URLs', 'falls back to explainer RAG']}
          />

          <FeatCard
            emoji="⚡"
            iconBg="bg-yellow-100"
            name="Multi-Provider AI"
            teaser="Fresh questions every session via Groq, Gemini, Perplexity, or Qwen — no static question banks."
            chips={['JSON schema enforced', 'safeJsonParse', 'token-scaled output']}
          />

          <FeatCard
            emoji="📋"
            iconBg="bg-blue-100"
            name="Official Blueprint Integration"
            teaser="Topic weights sourced directly from Splunk exam PDFs — enforced at generation time, overridden by adaptive weighting."
            chips={['per-cert blueprints', 'topic weight %', 'adaptive override']}
          />

          <FeatCard
            emoji="👥"
            iconBg="bg-rose-100"
            name="Community Difficulty Heatmap"
            teaser="Anonymized error rates aggregated from all users are displayed per topic on each cert card."
            chips={['community_stats D1', 'anonymized', 'per-topic']}
          />

          <FeatCard
            emoji="🌐"
            iconBg="bg-sky-100"
            name="Live Web Search Mode"
            teaser="Switch to Perplexity to ground questions in live Splunk docs searches beyond the RAG index's ingestion date."
            chips={['Perplexity engine', 'live search']}
          />

          <FeatCard
            emoji="🔒"
            iconBg="bg-slate-100"
            name="Dual-Signal Rate Limiting"
            teaser="Shared-key users are limited by both userId and hashed IP — incognito or localStorage clearing won't bypass it."
            chips={['10 exams/day', 'userId + hashed IP', 'own-key bypasses']}
          />

        </div>
      </Section>

      {/* ── 2. Agentic Architecture ── */}
      <Section
        title="Agentic architecture"
        subtitle="What happens between clicking 'Generate exam' and the first question appearing"
      >
        <div className="max-w-2xl">
          <ArchStep
            n="0" numStyle="bg-slate-200 text-slate-600"
            title="User triggers exam" badge="trigger" badgeStyle="bg-slate-100 border-slate-200 text-slate-600"
            desc="Reads adaptive profile + blueprint weights from D1. Checks usage limit (userId + hashed IP) for shared-key users."
          />
          <ArchStep
            n="1" numStyle="bg-teal-100 text-teal-800"
            title="Layer 2 — RAG + dedup" badge="parallel fetch" badgeStyle="bg-teal-50 border-teal-200 text-teal-700"
            desc="Embeds query → Vectorize 15 candidates (cosine ≥ 0.5) → Jina Reranker v3 → top-5 injected. Seen concepts (last 50) fetched from D1 simultaneously — zero added latency."
            chips={['bge-small-en-v1.5', 'Jina v3', '8s timeout', 'graceful fallback', '50 dedup hints']}
          />
          <ArchStep
            n="2" numStyle="bg-pink-100 text-pink-800"
            title="Generation" badge="AI" badgeStyle="bg-pink-50 border-pink-200 text-pink-700"
            desc="LLM generates with RAG passages + dedup exclusions + adaptive weights injected. filterDocSources strips hallucinated URLs post-generation."
            chips={['JSON schema enforced', 'safeJsonParse', 'URL filter', 'token-scaled']}
          />
          <ArchStep
            n="3" numStyle="bg-purple-100 text-purple-800"
            title="Layer 1 — Validation" badge="quality" badgeStyle="bg-purple-50 border-purple-200 text-purple-700"
            desc="6-rule check on every question. Failures trigger targeted regeneration. Failure rates per topic written to Layer 3."
            chips={['6 rules', '10% threshold', 'max 4 cycles', '→ Layer 3']}
          />
          <ArchStep
            n="4" numStyle="bg-slate-200 text-slate-600"
            title="Exam runs" badge="session" badgeStyle="bg-slate-100 border-slate-200 text-slate-600"
            desc="User completes the exam. Score and per-topic results recorded."
          />
          <ArchStep
            n="5" numStyle="bg-orange-100 text-orange-800"
            title="Layer 3 — Post-exam writes" badge="adaptive" badgeStyle="bg-orange-50 border-orange-200 text-orange-700"
            desc="Writes topic error rates, community stats, wrong_answers (spaced rep), seen_concepts (dedup), generation_traces (observability) — all fire-and-forget."
            chips={['5 D1 writes', 'fire-and-forget', '1.8× weak topic boost next session']}
          />
          <ArchStep
            n="6" numStyle="bg-indigo-100 text-indigo-800"
            title="On-demand — Explainer" badge="lazy" badgeStyle="bg-indigo-50 border-indigo-200 text-indigo-700"
            desc="'Why?' triggers independent RAG retrieval per wrong answer. Depth chosen from times_missed in D1."
            chips={['1× basic', '2× detailed', '3× deep + analogy']}
            last
          />
        </div>
      </Section>

      {/* ── 3. How to Use ── */}
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
              'Community heatmap shows hardest topics before you start',
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
