import { useState, useEffect } from 'react';
import {
  CheckCircle, XCircle, AlertTriangle, BookOpen, RotateCcw,
  ExternalLink, Zap, BarChart2, RefreshCw, BadgeCheck,
  CalendarCheck, FileText, Shield, Target, ChevronDown, ChevronUp,
  GraduationCap, QrCode,
} from 'lucide-react';
import { TOPIC_LINKS, EXAM_BLUEPRINTS } from '../utils/constants';
import { DEFAULT_GROQ_KEY } from '../utils/api';
import { getProfileSummary, clearProfile, getUserId, getWrongAnswerBank, computeExamReadiness } from '../utils/agentAdaptive';
import WrongAnswerCard from './WrongAnswerCard';
import ShareProfileModal from './ShareProfileModal';

function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < Math.min(str.length, 200); i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

// ─── Tab bar ──────────────────────────────────────────────────────────────────
function TabBar({ active, onChange, wrongCount }) {
  const tabs = [
    { id: 'results', label: 'Results' },
    { id: 'review',  label: 'Review', badge: wrongCount > 0 ? wrongCount : null },
    { id: 'actions', label: 'Actions' },
  ];
  return (
    <div className="flex border-b border-slate-200 bg-white rounded-t-xl overflow-hidden">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-semibold transition-all relative
            ${active === tab.id
              ? 'text-indigo-700 bg-indigo-50/60'
              : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
        >
          {tab.label}
          {tab.badge && (
            <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center
              ${active === tab.id
                ? 'bg-indigo-200 text-indigo-800'
                : 'bg-slate-200 text-slate-600'
              }`}
            >
              {tab.badge}
            </span>
          )}
          {active === tab.id && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full" />
          )}
        </button>
      ))}
    </div>
  );
}

// ─── Readiness Score Card ─────────────────────────────────────────────────────
function ReadinessCard({ examType, bp }) {
  const [open, setOpen] = useState(false);
  const readiness = computeExamReadiness(examType, bp?.topics);

  if (!readiness || readiness.sessions === 0) return null;

  const unAttempted = readiness.breakdown.filter(t => !t.attempted);

  return (
    <div className={`rounded-xl border p-5 ${readiness.labelBg}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-white/80 flex items-center justify-center shadow-sm">
            <Target className={`w-4 h-4 ${readiness.labelColor}`} />
          </div>
          <div>
            <h4 className="font-bold text-slate-800 text-sm">Exam Readiness</h4>
            <p className="text-xs text-slate-500 mt-0.5">
              {readiness.sessions} session{readiness.sessions !== 1 ? 's' : ''} · {readiness.coveredPct}% covered
              {readiness.graduatedCount > 0 && (
                <span className="ml-1.5 text-emerald-600 font-semibold">
                  · {readiness.graduatedCount} mastered 🎓
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className={`text-2xl font-black ${readiness.labelColor}`}>{readiness.score}%</div>
          <div className={`text-xs font-bold px-2 py-0.5 rounded-full border mt-1 inline-block ${readiness.labelBg} ${readiness.labelColor}`}>
            {readiness.label}
          </div>
        </div>
      </div>

      <div className="w-full bg-white/60 h-1.5 rounded-full overflow-hidden mb-2">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            readiness.score >= 80 ? 'bg-emerald-500' :
            readiness.score >= 65 ? 'bg-blue-500'    :
            readiness.score >= 45 ? 'bg-amber-500'   :
                                    'bg-red-500'
          }`}
          style={{ width: `${readiness.score}%` }}
        />
      </div>

      {unAttempted.length > 0 && (
        <p className="text-xs text-slate-600 bg-white/60 rounded-lg px-3 py-2 mb-2">
          <span className="font-semibold">Coverage gap:</span> {unAttempted.length} topic{unAttempted.length !== 1 ? 's' : ''} never attempted
          {unAttempted.length <= 3 && (
            <span className="text-slate-500"> ({unAttempted.map(t => t.name).join(', ')})</span>
          )}
        </p>
      )}

      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between text-xs font-semibold text-slate-600 hover:text-slate-800 mt-1 transition-colors"
      >
        <span>Topic breakdown</span>
        {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </button>

      {open && (
        <div className="mt-3 space-y-1.5 animate-fade-in max-h-52 overflow-y-auto pr-1">
          {readiness.breakdown.map((t, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-24 flex-shrink-0">
                <div className="h-1.5 bg-white/60 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      t.graduated      ? 'bg-emerald-400' :
                      !t.attempted     ? 'bg-slate-300'   :
                      t.accuracy >= 80 ? 'bg-emerald-400' :
                      t.accuracy >= 60 ? 'bg-blue-400'    :
                      t.accuracy >= 40 ? 'bg-amber-400'   :
                                         'bg-red-400'
                    }`}
                    style={{ width: `${t.accuracy}%` }}
                  />
                </div>
              </div>
              <span className="text-xs text-slate-600 truncate flex-grow">{t.name}</span>
              {t.graduated && <GraduationCap className="w-3 h-3 text-emerald-500 flex-shrink-0" />}
              <span className={`text-xs font-bold flex-shrink-0 ${
                t.graduated      ? 'text-emerald-600' :
                !t.attempted     ? 'text-slate-400'   :
                t.accuracy >= 80 ? 'text-emerald-600' :
                t.accuracy >= 60 ? 'text-blue-600'    :
                t.accuracy >= 40 ? 'text-amber-600'   :
                                   'text-red-600'
              }`}>
                {t.graduated ? '🎓' : t.attempted ? `${t.accuracy}%` : '—'}
              </span>
              <span className="text-xs text-slate-400 flex-shrink-0 w-6 text-right">{t.pct}%</span>
            </div>
          ))}
          <p className="text-xs text-slate-400 pt-1 border-t border-white/40">
            Bar = accuracy · Right = blueprint weight · 🎓 = mastered
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Learning Profile Card ────────────────────────────────────────────────────
function LearningProfileCard({ examType, profileVersion, setProfileVersion }) {
  const profile         = getProfileSummary(examType);
  if (!profile || profile.sessions < 1) return null;

  const graduatedTopics = profile.topics.filter(t => t.graduatedAt);
  const topTopics       = profile.topics.slice(0, 5);

  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-purple-500" /> Your Learning Profile
          </h4>
          <p className="text-xs text-slate-400 mt-0.5">
            {profile.sessions} session{profile.sessions !== 1 ? 's' : ''} tracked
            {graduatedTopics.length > 0 && (
              <span className="ml-1.5 text-emerald-600 font-semibold">
                · {graduatedTopics.length} mastered 🎓
              </span>
            )}
          </p>
        </div>
        <button
          onClick={() => { clearProfile(examType); setProfileVersion(v => v + 1); }}
          className="text-xs text-slate-400 hover:text-red-500 transition-colors"
          title="Reset adaptive profile"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="mb-3 bg-slate-50 border border-slate-200 rounded-lg p-2.5 flex items-center gap-2">
        <Shield className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
        <div className="min-w-0">
          <p className="text-xs text-slate-500 leading-none mb-0.5">Anonymous ID — use on any device</p>
          <p className="text-xs font-mono text-slate-700 truncate">{getUserId()}</p>
        </div>
      </div>

      <div className="space-y-2">
        {topTopics.map((t, i) => {
          const isGrad = !!(t.graduatedAt);
          return (
            <div key={i}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-slate-600 truncate pr-2 max-w-[55%] flex items-center gap-1">
                  {isGrad && <GraduationCap className="w-3 h-3 text-emerald-500 flex-shrink-0" />}
                  {t.name}
                </span>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {isGrad ? (
                    <span className="text-xs font-bold text-emerald-600">Mastered</span>
                  ) : (
                    <span className={`text-xs font-bold ${t.errorRate > 50 ? 'text-red-600' : t.errorRate > 25 ? 'text-orange-500' : 'text-green-600'}`}>
                      {100 - t.errorRate}%
                    </span>
                  )}
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                    isGrad                  ? 'bg-emerald-100 text-emerald-700' :
                    t.trend === 'improving' ? 'bg-green-100 text-green-700'    :
                    t.trend === 'declining' ? 'bg-red-100 text-red-700'        :
                    t.trend === 'new'       ? 'bg-blue-100 text-blue-700'      :
                                              'bg-slate-100 text-slate-500'
                  }`}>
                    {isGrad ? '🎓' : t.trend}
                  </span>
                </div>
              </div>
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    isGrad           ? 'bg-emerald-400' :
                    t.errorRate > 50 ? 'bg-red-400'     :
                    t.errorRate > 25 ? 'bg-orange-400'  :
                                       'bg-green-400'
                  }`}
                  style={{ width: isGrad ? '100%' : `${100 - t.errorRate}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {profile.topics.length > 5 && (
        <p className="text-xs text-slate-400 mt-3 text-center">
          +{profile.topics.length - 5} more topics tracked
        </p>
      )}
    </div>
  );
}

// ─── Tab 1: Results ───────────────────────────────────────────────────────────
function ResultsTab({ topicsToReview, examType, bp, profileVersion, setProfileVersion }) {
  return (
    <div className="p-6 space-y-6">

      {/* Topics to Review */}
      <div>
        <h3 className="text-base font-bold text-slate-800 flex items-center mb-4">
          <BookOpen className="w-5 h-5 mr-2 text-pink-500" /> Topics to Review
        </h3>
        {topicsToReview.length === 0 ? (
          <div className="text-center py-8 text-slate-500 bg-slate-50 rounded-xl border border-slate-100">
            <CheckCircle className="w-10 h-10 mx-auto text-green-400 mb-2" />
            <p className="text-sm">Perfect — no topics missed this session.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {topicsToReview.map((item, idx) => (
              <div key={idx} className="bg-red-50 border border-red-100 rounded-lg p-4 flex justify-between items-start sm:items-center flex-col sm:flex-row gap-3">
                <div className="flex flex-col">
                  <span className="font-semibold text-slate-700 text-sm">{item.topic}</span>
                  <a
                    href={TOPIC_LINKS[item.topic] || `https://docs.splunk.com/Documentation/Splunk/latest/Search?q=${encodeURIComponent(item.topic)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-pink-600 hover:text-pink-800 text-xs mt-1 flex items-center font-medium transition-colors"
                  >
                    Review Documentation <ExternalLink className="w-3 h-3 ml-1" />
                  </a>
                </div>
                <span className="bg-red-200 text-red-800 text-xs rounded-full font-bold px-3 py-1 whitespace-nowrap self-start sm:self-auto flex-shrink-0">
                  {item.errors} error{item.errors > 1 ? 's' : ''}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Exam Readiness */}
      <ReadinessCard examType={examType} bp={bp} />

      {/* Learning Profile */}
      <LearningProfileCard
        examType={examType}
        profileVersion={profileVersion}
        setProfileVersion={setProfileVersion}
      />

    </div>
  );
}

// ─── Tab 2: Review ────────────────────────────────────────────────────────────
function ReviewTab({ wrongAnswers, userAnswers, bp, groqKey, examType }) {
  if (wrongAnswers.length === 0) {
    return (
      <div className="p-10 text-center">
        <CheckCircle className="w-12 h-12 mx-auto text-green-400 mb-3" />
        <p className="font-semibold text-slate-700">No wrong answers this session.</p>
        <p className="text-slate-500 text-sm mt-1">Come back after your next exam.</p>
      </div>
    );
  }
  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-slate-500">
          {wrongAnswers.length} missed question{wrongAnswers.length !== 1 ? 's' : ''} — click{' '}
          <span className="font-semibold text-indigo-600">Why?</span> for an AI explanation
        </p>
        <div className="hidden sm:flex items-center gap-1.5 bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold px-3 py-1.5 rounded-lg flex-shrink-0 ml-3">
          <Zap className="w-3.5 h-3.5" /> AI explanations
        </div>
      </div>
      {wrongAnswers.map(({ q, idx }) => (
        <WrongAnswerCard
          key={idx}
          questionIndex={idx}
          question={q.question}
          yourAnswer={q.options[userAnswers[idx]] ?? 'No answer selected'}
          correctAnswer={q.options[q.correctIndex]}
          allOptions={q.options}
          topic={q.topic}
          examType={examType}
          blueprintLevel={bp?.level || 'Intermediate-Level'}
          apiKey={groqKey}
          docSource={q.docSource || ''}
          timesMissed={q.times_missed || 1}
        />
      ))}
    </div>
  );
}

// ─── Tab 3: Actions ───────────────────────────────────────────────────────────
function ActionsTab({
  examType, bp, passed, wrongAnswers,
  handleStartReview, onRetry, setShowShareModal,
}) {
  return (
    <div className="p-6 space-y-5">

      {/* Review session CTA */}
      {wrongAnswers.length > 0 && (
        <div className="bg-white rounded-xl border border-orange-100 shadow-sm p-5">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
              <RefreshCw className="w-5 h-5 text-orange-600" />
            </div>
            <div className="min-w-0">
              <h4 className="font-bold text-slate-800 text-sm">Review Weak Topics</h4>
              <p className="text-slate-500 text-xs mt-1 leading-relaxed">
                Launch a focused session mixing your {wrongAnswers.length} missed question{wrongAnswers.length !== 1 ? 's' : ''} with fresh AI questions on the same weak topics.
              </p>
            </div>
          </div>
          <button
            onClick={handleStartReview}
            className="w-full flex items-center justify-center px-5 py-2.5 rounded-lg font-bold bg-orange-500 text-white hover:bg-orange-600 transition-colors shadow-sm text-sm"
          >
            <RefreshCw className="w-4 h-4 mr-2" /> Start Review Session
          </button>
        </div>
      )}

      {/* Pass / Fail CTA */}
      {passed ? (
        <div className="bg-white rounded-xl border border-emerald-100 shadow-sm p-5 flex flex-col items-center text-center gap-4">
          <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
            <BadgeCheck className="w-7 h-7 text-emerald-600" />
          </div>
          <div>
            <h4 className="font-bold text-slate-800">You're Ready — Go for It!</h4>
            <p className="text-slate-500 text-sm mt-1">Mock score clears 70%. Consider booking the real exam while the material is fresh.</p>
          </div>
          {bp && (
            <a href={bp.scheduleUrl} target="_blank" rel="noopener noreferrer"
              className="w-full flex items-center justify-center px-5 py-2.5 rounded-lg font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-sm text-sm"
            >
              <CalendarCheck className="w-4 h-4 mr-2" /> Schedule the Real Exam
            </a>
          )}
          <button onClick={onRetry}
            className="w-full flex items-center justify-center px-5 py-2.5 rounded-lg font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors text-sm"
          >
            <RotateCcw className="w-4 h-4 mr-2" /> Practice Again
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 flex flex-col items-center text-center gap-4">
          <div className="bg-slate-50 rounded-lg w-full p-4">
            <AlertTriangle className="w-8 h-8 mx-auto text-orange-400 mb-2" />
            <h4 className="font-bold text-slate-800 text-sm mb-1">Keep Studying</h4>
            <p className="text-slate-600 text-xs leading-relaxed">
              Check the Results tab for topics to focus on — especially those with multiple errors.
            </p>
          </div>
          {bp && (
            <a href={bp.blueprintUrl} target="_blank" rel="noopener noreferrer"
              className="w-full flex items-center justify-center px-5 py-2.5 rounded-lg font-semibold bg-pink-50 text-pink-700 hover:bg-pink-100 transition-colors border border-pink-200 text-sm"
            >
              <FileText className="w-4 h-4 mr-2" /> Review Official Blueprint PDF
            </a>
          )}
          <button onClick={onRetry}
            className="w-full flex items-center justify-center px-5 py-2.5 rounded-lg font-bold bg-slate-800 text-white hover:bg-slate-900 transition-colors text-sm"
          >
            <RotateCcw className="w-4 h-4 mr-2" /> Try Again
          </button>
        </div>
      )}

      {/* Continue on another device */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 flex flex-col items-center text-center">
        <div className="w-9 h-9 bg-pink-100 rounded-lg flex items-center justify-center mb-3">
          <QrCode className="w-4 h-4 text-pink-600" />
        </div>
        <h4 className="font-bold text-slate-800 text-sm mb-1">Continue on another device</h4>
        <p className="text-slate-500 text-xs mb-4 leading-relaxed">
          Transfer your adaptive profile, wrong answer bank, and study progress to any device via QR code.
        </p>
        <button
          onClick={() => setShowShareModal(true)}
          className="w-full flex items-center justify-center px-5 py-2.5 rounded-lg font-semibold bg-pink-50 text-pink-700 hover:bg-pink-100 transition-colors border border-pink-200 text-sm"
        >
          <QrCode className="w-4 h-4 mr-2" /> Show QR Code
        </button>
      </div>

    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function ResultsScreen({
  resultsData,
  examType,
  questions,
  userAnswers,
  apiKeys,
  profileVersion,
  setProfileVersion,
  handleStartReview,
  onShowFeedback,
  onRetry,
}) {
  if (!resultsData) return null;

  const { score, passed, correct, total, topicsToReview } = resultsData;
  const bp      = EXAM_BLUEPRINTS[examType];
  const groqKey = apiKeys['llama'] || DEFAULT_GROQ_KEY;

  const [activeTab,         setActiveTab]         = useState('results');
  const [enrichedQuestions, setEnrichedQuestions] = useState(questions);
  const [showShareModal,    setShowShareModal]    = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function enrichWithTimesMissed() {
      try {
        const { wrongAnswers: bankItems } = await getWrongAnswerBank(examType, false);
        if (!bankItems || bankItems.length === 0 || cancelled) return;
        const missedMap = {};
        for (const item of bankItems) missedMap[item.question_hash] = item.times_missed;
        const enriched = questions.map(q => {
          const hash        = simpleHash(q.question);
          const timesMissed = missedMap[hash];
          return timesMissed !== undefined ? { ...q, times_missed: timesMissed } : q;
        });
        if (!cancelled) setEnrichedQuestions(enriched);
      } catch { /* non-fatal */ }
    }
    enrichWithTimesMissed();
    return () => { cancelled = true; };
  }, [examType, questions]);

  const wrongAnswers = enrichedQuestions
    .map((q, idx) => ({ q, idx }))
    .filter(({ q, idx }) => userAnswers[idx] !== q.correctIndex);

  void profileVersion;

  return (
    <div className="max-w-3xl mx-auto w-full animate-fade-in space-y-6 pb-12">

      {showShareModal && (
        <ShareProfileModal onClose={() => setShowShareModal(false)} />
      )}

      {/* ── Score header — always visible ── */}
      <div className={`p-8 md:p-10 text-center text-white rounded-2xl shadow-xl relative overflow-hidden
        ${passed ? 'bg-gradient-to-br from-green-500 to-emerald-700' : 'bg-gradient-to-br from-red-500 to-pink-700'}`}
      >
        <div className="absolute top-0 right-0 -mt-10 -mr-10 opacity-20">
          {passed ? <CheckCircle className="w-56 h-56" /> : <XCircle className="w-56 h-56" />}
        </div>
        <div className="relative z-10 space-y-3">
          <h1 className="text-3xl md:text-4xl font-extrabold">
            {passed ? 'Congratulations, You Passed!' : 'Exam Failed'}
          </h1>
          <p className="text-lg md:text-xl font-medium opacity-90">{examType} Mock Exam</p>
          <div className="inline-block bg-white/20 px-8 py-3 rounded-xl backdrop-blur-sm mt-2">
            <div className="text-4xl font-black">{score}%</div>
            <div className="text-xs font-medium uppercase tracking-wider mt-0.5 opacity-80">Session Score</div>
          </div>
          <p className="text-base opacity-90">{correct} of {total} questions correct</p>
        </div>
      </div>

      {/* ── Tabbed panel ── */}
      <div className="bg-white rounded-xl shadow-md border border-slate-100 overflow-hidden">
        <TabBar
          active={activeTab}
          onChange={setActiveTab}
          wrongCount={wrongAnswers.length}
        />

        {activeTab === 'results' && (
          <ResultsTab
            topicsToReview={topicsToReview}
            examType={examType}
            bp={bp}
            profileVersion={profileVersion}
            setProfileVersion={setProfileVersion}
          />
        )}

        {activeTab === 'review' && (
          <ReviewTab
            wrongAnswers={wrongAnswers}
            userAnswers={userAnswers}
            bp={bp}
            groqKey={groqKey}
            examType={examType}
          />
        )}

        {activeTab === 'actions' && (
          <ActionsTab
            examType={examType}
            bp={bp}
            passed={passed}
            wrongAnswers={wrongAnswers}
            handleStartReview={handleStartReview}
            onRetry={onRetry}
            setShowShareModal={setShowShareModal}
          />
        )}
      </div>

    </div>
  );
}
