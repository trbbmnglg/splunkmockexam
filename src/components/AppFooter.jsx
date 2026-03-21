import { useState } from 'react';
import {
  ChevronDown, BookOpen, Zap, ShieldCheck, BarChart2,
  Star, Globe, FileText, Users, RefreshCw, Settings,
  Filter, Shield, Database, Repeat,
} from 'lucide-react';

/* ─── Section toggle ─────────────────────────────────────────────────────── */
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

/* ─── Zone-based SVG architecture diagram ───────────────────────────────── */
function AgentDiagram() {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3 overflow-x-auto">
      <svg
        width="100%"
        viewBox="0 0 680 860"
        xmlns="http://www.w3.org/2000/svg"
        style={{ fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif', minWidth: '480px' }}
      >
        <defs>
          <marker id="af-arr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M2 1L8 5L2 9" fill="none" stroke="context-stroke" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </marker>
        </defs>

        {/* ── Zone 0: user trigger ── */}
        <rect x="20" y="20" width="640" height="68" rx="10" fill="none" stroke="#B4B2A9" strokeWidth="0.5" strokeDasharray="4 3"/>
        <text fontSize="11" fill="#888780" x="36" y="38">user trigger</text>
        <rect x="40" y="44" width="172" height="36" rx="6" fill="#F1EFE8" stroke="#B4B2A9" strokeWidth="0.5"/>
        <text fontSize="12" fontWeight="500" fill="#444441" x="126" y="66" textAnchor="middle">Adaptive profile</text>
        <rect x="228" y="44" width="172" height="36" rx="6" fill="#F1EFE8" stroke="#B4B2A9" strokeWidth="0.5"/>
        <text fontSize="12" fontWeight="500" fill="#444441" x="314" y="66" textAnchor="middle">Blueprint weights</text>
        <rect x="416" y="44" width="224" height="36" rx="6" fill="#F1EFE8" stroke="#B4B2A9" strokeWidth="0.5"/>
        <text fontSize="12" fontWeight="500" fill="#444441" x="528" y="66" textAnchor="middle">Usage check (userId + IP)</text>

        <line x1="340" y1="88" x2="340" y2="108" stroke="#B4B2A9" strokeWidth="1" markerEnd="url(#af-arr)"/>

        {/* ── Zone 1: pre-generation ── */}
        <rect x="20" y="112" width="640" height="150" rx="10" fill="none" stroke="#5DCAA5" strokeWidth="0.5" strokeDasharray="4 3"/>
        <text fontSize="11" fill="#0F6E56" x="36" y="130">pre-generation — parallel fetch</text>

        <rect x="40" y="138" width="120" height="52" rx="6" fill="#E1F5EE" stroke="#5DCAA5" strokeWidth="0.5"/>
        <text fontSize="12" fontWeight="500" fill="#085041" x="100" y="157" textAnchor="middle">Embed query</text>
        <text fontSize="11" fill="#0F6E56" x="100" y="174" textAnchor="middle">bge-small-en-v1.5</text>
        <line x1="160" y1="164" x2="176" y2="164" stroke="#1D9E75" strokeWidth="1" markerEnd="url(#af-arr)"/>

        <rect x="176" y="138" width="120" height="52" rx="6" fill="#E1F5EE" stroke="#5DCAA5" strokeWidth="0.5"/>
        <text fontSize="12" fontWeight="500" fill="#085041" x="236" y="157" textAnchor="middle">Vectorize</text>
        <text fontSize="11" fill="#0F6E56" x="236" y="174" textAnchor="middle">15 cands · cos ≥ 0.5</text>
        <line x1="296" y1="164" x2="312" y2="164" stroke="#1D9E75" strokeWidth="1" markerEnd="url(#af-arr)"/>

        <rect x="312" y="138" width="128" height="52" rx="6" fill="#E1F5EE" stroke="#5DCAA5" strokeWidth="0.5"/>
        <text fontSize="12" fontWeight="500" fill="#085041" x="376" y="157" textAnchor="middle">Jina Reranker v3</text>
        <text fontSize="11" fill="#0F6E56" x="376" y="174" textAnchor="middle">top-5 passages</text>
        <line x1="440" y1="164" x2="456" y2="164" stroke="#1D9E75" strokeWidth="1" markerEnd="url(#af-arr)"/>

        <rect x="456" y="138" width="172" height="52" rx="6" fill="#E1F5EE" stroke="#5DCAA5" strokeWidth="0.5"/>
        <text fontSize="12" fontWeight="500" fill="#085041" x="542" y="157" textAnchor="middle">RAG context ready</text>
        <text fontSize="11" fill="#0F6E56" x="542" y="174" textAnchor="middle">5 doc passages injected</text>

        <text fontSize="11" fill="#888780" x="44" y="216">parallel</text>
        <rect x="82" y="204" width="164" height="44" rx="6" fill="#E1F5EE" stroke="#5DCAA5" strokeWidth="0.5"/>
        <text fontSize="12" fontWeight="500" fill="#085041" x="164" y="222" textAnchor="middle">Fetch seen concepts</text>
        <text fontSize="11" fill="#0F6E56" x="164" y="238" textAnchor="middle">last 50 hints from D1</text>
        <line x1="246" y1="226" x2="456" y2="226" stroke="#1D9E75" strokeWidth="1" strokeDasharray="3 3" markerEnd="url(#af-arr)"/>
        <rect x="456" y="204" width="172" height="44" rx="6" fill="#E1F5EE" stroke="#5DCAA5" strokeWidth="0.5"/>
        <text fontSize="12" fontWeight="500" fill="#085041" x="542" y="222" textAnchor="middle">Dedup hints ready</text>
        <text fontSize="11" fill="#0F6E56" x="542" y="238" textAnchor="middle">grouped by topic</text>

        <line x1="340" y1="262" x2="340" y2="282" stroke="#B4B2A9" strokeWidth="1" markerEnd="url(#af-arr)"/>

        {/* ── Zone 2: generation loop ── */}
        <rect x="20" y="286" width="640" height="196" rx="10" fill="none" stroke="#AFA9EC" strokeWidth="0.5" strokeDasharray="4 3"/>
        <text fontSize="11" fill="#534AB7" x="36" y="304">generation loop</text>

        <rect x="40" y="312" width="240" height="62" rx="6" fill="#EEEDFE" stroke="#AFA9EC" strokeWidth="0.5"/>
        <text fontSize="12" fontWeight="500" fill="#26215C" x="160" y="336" textAnchor="middle">AI Question Generator</text>
        <text fontSize="11" fill="#534AB7" x="160" y="356" textAnchor="middle">RAG + dedup + adaptive weights</text>
        <line x1="280" y1="343" x2="300" y2="343" stroke="#534AB7" strokeWidth="1" markerEnd="url(#af-arr)"/>

        <rect x="300" y="312" width="212" height="62" rx="6" fill="#EEEDFE" stroke="#AFA9EC" strokeWidth="0.5"/>
        <text fontSize="12" fontWeight="500" fill="#26215C" x="406" y="330" textAnchor="middle">Layer 1 — Validator</text>
        <text fontSize="11" fill="#534AB7" x="406" y="347" textAnchor="middle">6 rules · 10% threshold</text>
        <text fontSize="11" fill="#534AB7" x="406" y="363" textAnchor="middle">max 4 cycles (own key)</text>
        <line x1="512" y1="343" x2="528" y2="343" stroke="#534AB7" strokeWidth="1" markerEnd="url(#af-arr)"/>

        <rect x="528" y="312" width="112" height="62" rx="6" fill="#EEEDFE" stroke="#AFA9EC" strokeWidth="0.5"/>
        <text fontSize="12" fontWeight="500" fill="#26215C" x="584" y="330" textAnchor="middle">URL filter</text>
        <text fontSize="11" fill="#534AB7" x="584" y="347" textAnchor="middle">strips ungrounded</text>
        <text fontSize="11" fill="#534AB7" x="584" y="363" textAnchor="middle">docSource links</text>

        {/* retry loop */}
        <path d="M406 374 L406 428 L160 428 L160 374" fill="none" stroke="#7F77DD" strokeWidth="1" strokeDasharray="4 3" markerEnd="url(#af-arr)"/>
        <text fontSize="11" fill="#534AB7" x="283" y="422" textAnchor="middle">retry on failure</text>
        <text fontSize="11" fill="#534AB7" x="406" y="454" textAnchor="middle">failure rates → Layer 3</text>
        <line x1="406" y1="458" x2="406" y2="468" stroke="#7F77DD" strokeWidth="0.5" strokeDasharray="2 2"/>

        <line x1="340" y1="482" x2="340" y2="504" stroke="#B4B2A9" strokeWidth="1" markerEnd="url(#af-arr)"/>
        <text fontSize="11" fill="#888780" x="348" y="496">exam runs</text>

        {/* ── Zone 3: post-exam ── */}
        <rect x="20" y="508" width="640" height="196" rx="10" fill="none" stroke="#EF9F27" strokeWidth="0.5" strokeDasharray="4 3"/>
        <text fontSize="11" fill="#854F0B" x="36" y="526">post-exam — parallel writes (fire-and-forget)</text>

        <rect x="258" y="534" width="164" height="44" rx="6" fill="#FAEEDA" stroke="#EF9F27" strokeWidth="0.5"/>
        <text fontSize="12" fontWeight="500" fill="#412402" x="340" y="552" textAnchor="middle">Layer 3 — Adaptive</text>
        <text fontSize="11" fill="#854F0B" x="340" y="568" textAnchor="middle">results processed</text>

        <line x1="270" y1="578" x2="126" y2="614" stroke="#BA7517" strokeWidth="0.8" markerEnd="url(#af-arr)"/>
        <line x1="300" y1="578" x2="252" y2="614" stroke="#BA7517" strokeWidth="0.8" markerEnd="url(#af-arr)"/>
        <line x1="340" y1="578" x2="340" y2="614" stroke="#BA7517" strokeWidth="0.8" markerEnd="url(#af-arr)"/>
        <line x1="380" y1="578" x2="428" y2="614" stroke="#BA7517" strokeWidth="0.8" markerEnd="url(#af-arr)"/>
        <line x1="410" y1="578" x2="546" y2="614" stroke="#BA7517" strokeWidth="0.8" markerEnd="url(#af-arr)"/>

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

        {/* feedback: seen_concepts → pre-gen next session */}
        <path d="M20 658 L8 658 L8 170 L40 170" fill="none" stroke="#1D9E75" strokeWidth="0.8" strokeDasharray="3 3" markerEnd="url(#af-arr)"/>
        <text fontSize="10" fill="#0F6E56" x="44" y="186">next session</text>

        {/* feedback: topic_profiles → trigger zone */}
        <path d="M126 614 L126 548 L20 548 L20 62 L40 62" fill="none" stroke="#888780" strokeWidth="0.8" strokeDasharray="3 3" markerEnd="url(#af-arr)"/>

        <line x1="340" y1="704" x2="340" y2="724" stroke="#B4B2A9" strokeWidth="0.5" strokeDasharray="3 3"/>
        <text fontSize="11" fill="#888780" x="348" y="716">wrong answers</text>

        {/* ── Zone 4: on-demand explainer ── */}
        <rect x="20" y="728" width="640" height="112" rx="10" fill="none" stroke="#85B7EB" strokeWidth="0.5" strokeDasharray="4 3"/>
        <text fontSize="11" fill="#185FA5" x="36" y="746">on-demand — lazy trigger (user clicks "Why?")</text>

        <rect x="40" y="754" width="172" height="52" rx="6" fill="#E6F1FB" stroke="#85B7EB" strokeWidth="0.5"/>
        <text fontSize="12" fontWeight="500" fill="#042C53" x="126" y="773" textAnchor="middle">RAG retrieval</text>
        <text fontSize="11" fill="#185FA5" x="126" y="790" textAnchor="middle">per wrong answer</text>
        <line x1="212" y1="780" x2="232" y2="780" stroke="#185FA5" strokeWidth="1" markerEnd="url(#af-arr)"/>

        <rect x="232" y="754" width="172" height="52" rx="6" fill="#E6F1FB" stroke="#85B7EB" strokeWidth="0.5"/>
        <text fontSize="12" fontWeight="500" fill="#042C53" x="318" y="773" textAnchor="middle">Depth selector</text>
        <text fontSize="11" fill="#185FA5" x="318" y="790" textAnchor="middle">times_missed from D1</text>
        <line x1="404" y1="780" x2="424" y2="780" stroke="#185FA5" strokeWidth="1" markerEnd="url(#af-arr)"/>

        <rect x="424" y="754" width="236" height="52" rx="6" fill="#E6F1FB" stroke="#85B7EB" strokeWidth="0.5"/>
        <text fontSize="12" fontWeight="500" fill="#042C53" x="542" y="769" textAnchor="middle">Explanation output</text>
        <text fontSize="11" fill="#185FA5" x="542" y="785" textAnchor="middle">1× basic · 2× detailed</text>
        <text fontSize="11" fill="#185FA5" x="542" y="800" textAnchor="middle">3× first-principles + analogy</text>

        {/* legend */}
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

/* ─── Main footer ────────────────────────────────────────────────────────── */
export default function AppFooter({ gameState }) {
  const [featuresOpen, setFeaturesOpen] = useState(true);
  const [agenticOpen,  setAgenticOpen]  = useState(false);
  const [howToOpen,    setHowToOpen]    = useState(false);

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
            {/* Fixed 3-col grid — cards never stretch to fill fewer columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 text-sm text-slate-600">

              <div className="bg-white p-5 rounded-xl border-2 border-purple-200 flex gap-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 text-xs font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-bl-lg border-l border-b border-purple-200">Agentic · Layer 1</div>
                <div className="w-10 h-10 bg-purple-100 flex items-center justify-center rounded-lg flex-shrink-0 mt-0.5"><ShieldCheck className="w-5 h-5 text-purple-600" /></div>
                <div>
                  <h4 className="font-semibold text-slate-800 mb-1 text-sm leading-snug">Self-Validation Pipeline</h4>
                  <p>Every generated question is reviewed by a secondary Groq agent against 6 quality rules — answer-option mismatches, duplicates, formatting parity, forbidden phrases, difficulty calibration, and question integrity. Failures above the 10% threshold trigger targeted regeneration across up to 4 refinement cycles.</p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border-2 border-teal-200 flex gap-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 text-xs font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-bl-lg border-l border-b border-teal-200">Agentic · Layer 2</div>
                <div className="w-10 h-10 bg-teal-100 flex items-center justify-center rounded-lg flex-shrink-0 mt-0.5"><BookOpen className="w-5 h-5 text-teal-600" /></div>
                <div>
                  <h4 className="font-semibold text-slate-800 mb-1 text-sm leading-snug">3-Step RAG Pipeline</h4>
                  <p>Embed → Vectorize (15 candidates, cosine ≥ 0.5) → Jina Reranker v3 (8s timeout) → top-5 passages injected into every generation prompt. Falls back gracefully to Vectorize top-5 if Jina times out.</p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border-2 border-orange-200 flex gap-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 text-xs font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-bl-lg border-l border-b border-orange-200">Agentic · Layer 3</div>
                <div className="w-10 h-10 bg-orange-100 flex items-center justify-center rounded-lg flex-shrink-0 mt-0.5"><BarChart2 className="w-5 h-5 text-orange-600" /></div>
                <div>
                  <h4 className="font-semibold text-slate-800 mb-1 text-sm leading-snug">Adaptive Learning Agent</h4>
                  <p>Per-topic error rates and Layer 1 failure signals are tracked in D1 across sessions. Each new exam reweights question distribution toward your weakest areas — topics with &gt;60% error rate receive 1.8× the base allocation.</p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border-2 border-indigo-200 flex gap-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-bl-lg border-l border-b border-indigo-200">Agentic · On-demand</div>
                <div className="w-10 h-10 bg-indigo-100 flex items-center justify-center rounded-lg flex-shrink-0 mt-0.5"><Star className="w-5 h-5 text-indigo-600" /></div>
                <div>
                  <h4 className="font-semibold text-slate-800 mb-1 text-sm leading-snug">RAG-Grounded Explainer Agent</h4>
                  <p>The "Why?" explainer runs its own independent RAG retrieval per wrong answer. Depth escalates with <code className="text-xs bg-slate-100 px-1 rounded">times_missed</code>: basic (1×) → detailed (2×) → first-principles with analogy (3×+). Doc link uses RAG-retrieved URL, not a potentially stale generation-time source.</p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border-2 border-pink-200 flex gap-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 text-xs font-bold text-pink-600 bg-pink-50 px-2 py-0.5 rounded-bl-lg border-l border-b border-pink-200">Agentic · On-demand</div>
                <div className="w-10 h-10 bg-pink-100 flex items-center justify-center rounded-lg flex-shrink-0 mt-0.5"><RefreshCw className="w-5 h-5 text-pink-600" /></div>
                <div>
                  <h4 className="font-semibold text-slate-800 mb-1 text-sm leading-snug">Spaced Repetition Review Agent</h4>
                  <p>Missed questions are persisted to D1 on a 1→3→7→14→30→60 day schedule. Review sessions blend stored wrong answers with freshly generated AI questions on the same weak topics. Reviewed questions are cleared via hash-matched DELETE after each session.</p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border-2 border-cyan-200 flex gap-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 text-xs font-bold text-cyan-600 bg-cyan-50 px-2 py-0.5 rounded-bl-lg border-l border-b border-cyan-200">Agentic · Per-session</div>
                <div className="w-10 h-10 bg-cyan-100 flex items-center justify-center rounded-lg flex-shrink-0 mt-0.5"><Repeat className="w-5 h-5 text-cyan-600" /></div>
                <div>
                  <h4 className="font-semibold text-slate-800 mb-1 text-sm leading-snug">Cross-Session Duplicate Detection</h4>
                  <p>After every exam, question stems are hashed and saved to D1 (capped at 100 per cert). Before generation, the last 50 concept hints are fetched and injected as hard exclusions — grouped by topic. RAG and dedup fetches run in parallel, adding zero extra latency.</p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border-2 border-slate-200 flex gap-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 text-xs font-bold text-slate-500 bg-slate-50 px-2 py-0.5 rounded-bl-lg border-l border-b border-slate-200">Cross-layer</div>
                <div className="w-10 h-10 bg-slate-100 flex items-center justify-center rounded-lg flex-shrink-0 mt-0.5"><Zap className="w-5 h-5 text-slate-600" /></div>
                <div>
                  <h4 className="font-semibold text-slate-800 mb-1 text-sm leading-snug">L1 → L3 Quality Feedback Loop</h4>
                  <p>Layer 1 validation failure rates are written into Layer 3's adaptive profile. Topics that historically cause the AI to produce bad questions receive an explicit quality warning injected into every subsequent generation prompt — the system learns its own blind spots.</p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border-2 border-violet-200 flex gap-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 text-xs font-bold text-violet-600 bg-violet-50 px-2 py-0.5 rounded-bl-lg border-l border-b border-violet-200">Observability</div>
                <div className="w-10 h-10 bg-violet-100 flex items-center justify-center rounded-lg flex-shrink-0 mt-0.5"><Database className="w-5 h-5 text-violet-600" /></div>
                <div>
                  <h4 className="font-semibold text-slate-800 mb-1 text-sm leading-snug">Agent Trace Persistence</h4>
                  <p>Every generation run writes a full trace to D1's <code className="text-xs bg-slate-100 px-1 rounded">generation_traces</code> table — provider, model, token counts, latency, parse strategy, retry count, validation cycles and failures, and RAG passage count. A longitudinal record for diagnosing quality regressions.</p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border-2 border-emerald-200 flex gap-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-bl-lg border-l border-b border-emerald-200">Post-generation</div>
                <div className="w-10 h-10 bg-emerald-100 flex items-center justify-center rounded-lg flex-shrink-0 mt-0.5"><Filter className="w-5 h-5 text-emerald-600" /></div>
                <div>
                  <h4 className="font-semibold text-slate-800 mb-1 text-sm leading-snug">Hallucinated URL Filter</h4>
                  <p>After every generation, <code className="text-xs bg-slate-100 px-1 rounded">filterDocSources</code> strips any <code className="text-xs bg-slate-100 px-1 rounded">docSource</code> URL not present in the injected RAG passages — preventing the model from fabricating plausible-looking but fake Splunk documentation links.</p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex gap-4">
                <div className="w-10 h-10 bg-pink-100 flex items-center justify-center rounded-lg flex-shrink-0 mt-0.5"><Zap className="w-5 h-5 text-pink-600" /></div>
                <div>
                  <h4 className="font-semibold text-slate-800 mb-1 text-sm leading-snug">Multi-Provider AI Generation</h4>
                  <p>Fresh questions every session via Groq/Llama, Gemini, Perplexity, or Qwen — no static question banks. Groq and Qwen use <code className="text-xs bg-slate-100 px-1 rounded">response_format: json_object</code> for schema enforcement. A <code className="text-xs bg-slate-100 px-1 rounded">safeJsonParse</code> layer sanitizes bare control characters.</p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex gap-4">
                <div className="w-10 h-10 bg-blue-100 flex items-center justify-center rounded-lg flex-shrink-0 mt-0.5"><FileText className="w-5 h-5 text-blue-600" /></div>
                <div>
                  <h4 className="font-semibold text-slate-800 mb-1 text-sm leading-snug">Official Exam Blueprint Integration</h4>
                  <p>Topic weights sourced directly from Splunk exam PDFs — enforced at generation time and overridden by adaptive weighting when your profile has enough sessions. Each cert card shows questions, time limit, passing score, level, and per-topic percentages.</p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex gap-4">
                <div className="w-10 h-10 bg-cyan-100 flex items-center justify-center rounded-lg flex-shrink-0 mt-0.5"><Users className="w-5 h-5 text-cyan-600" /></div>
                <div>
                  <h4 className="font-semibold text-slate-800 mb-1 text-sm leading-snug">Community Difficulty Heatmap</h4>
                  <p>Anonymized error rates from all users are aggregated in D1's <code className="text-xs bg-slate-100 px-1 rounded">community_stats</code> table after every session and displayed per topic on each cert card — revealing which topics the community finds hardest before you start.</p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex gap-4">
                <div className="w-10 h-10 bg-rose-100 flex items-center justify-center rounded-lg flex-shrink-0 mt-0.5"><Globe className="w-5 h-5 text-rose-600" /></div>
                <div>
                  <h4 className="font-semibold text-slate-800 mb-1 text-sm leading-snug">Live Web Search Mode</h4>
                  <p>Switch to the Perplexity engine to ground questions in live Splunk documentation searches — ideal for keeping up with latest product changes beyond the RAG index's ingestion date.</p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex gap-4">
                <div className="w-10 h-10 bg-slate-100 flex items-center justify-center rounded-lg flex-shrink-0 mt-0.5"><Shield className="w-5 h-5 text-slate-600" /></div>
                <div>
                  <h4 className="font-semibold text-slate-800 mb-1 text-sm leading-snug">Dual-Signal Usage Rate Limiting</h4>
                  <p>Shared-key users are limited to 10 free exams per day, tracked by both userId and hashed IP. Either signal hitting the limit blocks the session — incognito or localStorage clearing won't bypass it. Own-key users bypass all limits.</p>
                </div>
              </div>

            </div>
          </div>
        )}
      </div>

      {/* ── Agentic Architecture ── */}
      <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-6 py-5 bg-white">
          <SectionToggle
            open={agenticOpen}
            onToggle={() => setAgenticOpen(o => !o)}
            title="Agentic AI Architecture"
            subtitle="Four zones — parallel fetches, a generation loop with retry, fan-out writes, and a lazy explainer."
            accentColor="bg-purple-500"
          />
        </div>
        {agenticOpen && (
          <div className="px-6 pb-6 pt-4 bg-slate-50/40 animate-fade-in">
            <AgentDiagram />
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
            subtitle="Four steps — the system wires everything else automatically."
            accentColor="bg-blue-500"
          />
        </div>
        {howToOpen && (
          <div className="px-6 pb-8 pt-4 bg-slate-50/40 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
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
                <div key={n} className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex flex-col gap-3">
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
          </div>
        )}
      </div>

      {/* attribution */}
      <div className="text-center text-xs text-slate-400 pb-4">
        <p>Not affiliated with or endorsed by Splunk Inc.</p>
      </div>

    </footer>
  );
}
