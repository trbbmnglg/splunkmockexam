import { useState, useEffect } from 'react';
import {
  CheckCircle, XCircle, AlertTriangle, BookOpen, Award, RotateCcw,
  ShieldCheck, ExternalLink, Zap, BarChart2, RefreshCw, BadgeCheck,
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

// ─── Readiness Score Card ─────────────────────────────────────────────────────
function ReadinessCard({ examType, bp }) {
  const [open, setOpen] = useState(false);
  const readiness = computeExamReadiness(examType, bp?.topics);

  if (!readiness || readiness.sessions === 0) return null;

  const unAttempted = readiness.breakdown.filter(t => !t.attempted);

  return (
    <div className={`bg-white rounded-xl shadow-md border p-6 ${readiness.labelBg}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/80 flex items-center justify-center shadow-sm">
            <Target className={`w-5 h-5 ${readiness.labelColor}`} />
          </div>
          <div>
            <h4 className="font-bold text-slate-800 text-sm">Exam Readiness</h4>
            <p className="text-xs text-slate-500 mt-0.5">
              {readiness.sessions} session{readiness.sessions !== 1 ? 's' : ''} · {readiness.coveredPct}% covered
              {readiness.graduatedCount > 0 && (
                <span className="ml-1.5 text-emerald-600 font-semibold">
                  · {readiness.graduatedCount} topic{readiness.graduatedCount !== 1 ? 's' : ''} mastered 🎓
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className={`text-3xl font-black ${readiness.labelColor}`}>{readiness.score}%</div>
          <div className={`text-xs font-bold px-2 py-0.5 rounded-full border mt-1 inline-block ${readiness.labelBg} ${readiness.labelColor}`}>
            {readiness.label}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-white/60 h-2 rounded-full overflow-hidden mb-3">
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

      {/* Coverage gap nudge */}
      {unAttempted.length > 0 && (
        <p className="text-xs text-slate-600 bg-white/60 rounded-lg px-3 py-2 mb-2">
          <span className="font-semibold">Coverage gap:</span> {unAttempted.length} blueprint topic{unAttempted.length !== 1 ? 's' : ''} never attempted
          {unAttempted.length <= 3 && (
            <span className="text-slate-500"> ({unAttempted.map(t => t.name).join(', ')})</span>
          )}
        </p>
      )}

      {/* Drill-down toggle */}
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
                      t.graduated          ? 'bg-emerald-400' :
                      !t.attempted         ? 'bg-slate-300'   :
                      t.accuracy >= 80     ? 'bg-emerald-400' :
                      t.accuracy >= 60     ? 'bg-blue-400'    :
                      t.accuracy >= 40     ? 'bg-amber-400'   :
                                             'bg-red-400'
                    }`}
                    style={{ width: `${t.accuracy}%` }}
                  />
                </div>
              </div>
              <span className="text-xs text-slate-600 truncate flex-grow">{t.name}</span>
              {t.graduated && (
                <GraduationCap className="w-3 h-3 text-emerald-500 flex-shrink-0" />
              )}
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
            Bar = accuracy · Right column = blueprint weight · 🎓 = mastered
          </p>
        </div>
      )}
    </div>
  );
}

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
          const hash = simpleHash(q.question);
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

  const profile = getProfileSummary(examType);
  void profileVersion;

  return (
    <div className="max-w-4xl mx-auto w-full animate-fade-in space-y-8 pb-12">

      {/* Share modal */}
      {showShareModal && (
        <ShareProfileModal onClose={() => setShowShareModal(false)} />
      )}

      {/* ── Score header ── */}
      <div className={`p-8 md:p-12 text-center text-white rounded-2xl shadow-xl relative overflow-hidden
        ${passed ? 'bg-gradient-to-br from-green-500 to-emerald-700' : 'bg-gradient-to-br from-red-500 to-pink-700'}`}
      >
        <div className="absolute top-0 right-0 -mt-10 -mr-10 opacity-20">
          {passed ? <CheckCircle className="w-64 h-64" /> : <XCircle className="w-64 h-64" />}
        </div>
        <div className="relative z-10 space-y-4">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-2">
            {passed ? 'Congratulations, You Passed!' : 'Exam Failed'}
          </h1>
          <p className="text-xl md:text-2xl font-medium opacity-90">{examType} Mock Exam</p>
          <div className="inline-block bg-white/20 px-8 py-4 rounded-xl backdrop-blur-sm mt-6">
            <div className="text-5xl font-black">{score}%</div>
            <div className="text-sm font-medium uppercase tracking-wider mt-1 opacity-80">Session Score</div>
          </div>
          <p className="text-lg opacity-90 mt-4">
            You answered {correct} out of {total} questions correctly.
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">

        {/* ── Topics to Review ── */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-slate-100 flex flex-col">
          <h3 className="text-xl font-bold text-slate-800 flex items-center mb-6">
            <BookOpen className="w-6 h-6 mr-2 text-pink-500" />Topics to Review
          </h3>
          {topicsToReview.length === 0 ? (
            <div className="text-center py-8 text-slate-500 bg-slate-50 rounded-lg h-full flex flex-col justify-center">
              <CheckCircle className="w-12 h-12 mx-auto text-green-400 mb-3" />
              <p>Perfect! You didn't miss any topics.</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 flex-grow">
              {topicsToReview.map((item, idx) => (
                <div key={idx} className="bg-red-50 border border-red-100 rounded-lg p-4 flex justify-between items-start sm:items-center flex-col sm:flex-row gap-3">
                  <div className="flex flex-col">
                    <span className="font-semibold text-slate-700">{item.topic}</span>
                    <a
                      href={TOPIC_LINKS[item.topic] || `https://docs.splunk.com/Documentation/Splunk/latest/Search?q=${encodeURIComponent(item.topic)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-pink-600 hover:text-pink-800 text-sm mt-1.5 flex items-center font-medium transition-colors"
                    >
                      Review Documentation <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
                    </a>
                  </div>
                  <span className="bg-red-200 text-red-800 text-xs rounded-full font-bold px-3 py-1.5 whitespace-nowrap self-start sm:self-auto">
                    {item.errors} error{item.errors > 1 ? 's' : ''}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Right column ── */}
        <div className="flex flex-col gap-6">

          {/* Exam Readiness Score */}
          <ReadinessCard examType={examType} bp={bp} />

          {/* Learning Profile */}
          {profile && profile.sessions >= 1 && (() => {
            const topTopics      = profile.topics.slice(0, 5);
            const graduatedTopics = profile.topics.filter(t => t.graduatedAt);
            return (
              <div className="bg-white rounded-xl shadow-md p-6 border border-slate-100">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="font-bold text-slate-800 flex items-center gap-2">
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
                    title="Reset adaptive profile for this exam"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="mb-3 bg-slate-50 border border-slate-200 rounded-lg p-2.5 flex items-center gap-2">
                  <Shield className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-slate-500 leading-none mb-0.5">Your anonymous ID — use on any device to continue your profile</p>
                    <p className="text-xs font-mono text-slate-700 truncate">{getUserId()}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  {topTopics.map((t, i) => {
                    const isGrad = !!(t.graduatedAt);
                    return (
                      <div key={i} className="flex items-center gap-3">
                        <div className="w-full">
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
                                isGrad           ? 'bg-emerald-400'  :
                                t.errorRate > 50 ? 'bg-red-400'      :
                                t.errorRate > 25 ? 'bg-orange-400'   :
                                                   'bg-green-400'
                              }`}
                              style={{ width: isGrad ? '100%' : `${100 - t.errorRate}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {profile.topics.length > 5 && (
                  <p className="text-xs text-slate-400 mt-3 text-center">+{profile.topics.length - 5} more topics tracked</p>
                )}
              </div>
            );
          })()}

          {/* Review Session CTA */}
          {wrongAnswers.length > 0 && (
            <div className="bg-white rounded-xl shadow-md p-6 border border-orange-100">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                  <RefreshCw className="w-6 h-6 text-orange-600" />
                </div>
                <div className="min-w-0">
                  <h4 className="font-bold text-slate-800">Review Weak Topics</h4>
                  <p className="text-slate-500 text-sm mt-1">
                    Launch a focused session mixing your {wrongAnswers.length} missed question{wrongAnswers.length !== 1 ? 's' : ''} with fresh AI questions on the same weak topics.
                  </p>
                </div>
              </div>
              <button
                onClick={handleStartReview}
                className="w-full flex items-center justify-center px-6 py-3 rounded-lg font-bold bg-orange-500 text-white hover:bg-orange-600 transition-colors shadow-md"
              >
                <RefreshCw className="w-4 h-4 mr-2" /> Start Review Session
              </button>
            </div>
          )}

          {/* Continue on another device — QR */}
          <div className="bg-white rounded-xl shadow-md p-6 border border-slate-100 flex flex-col items-center text-center">
            <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center mb-3">
              <QrCode className="w-5 h-5 text-pink-600" />
            </div>
            <h4 className="font-bold text-slate-800 mb-1">Continue on another device</h4>
            <p className="text-slate-500 text-sm mb-4">
              Scan a QR code to transfer your adaptive profile, wrong answer bank, and study progress to any device.
            </p>
            <button
              onClick={() => setShowShareModal(true)}
              className="w-full flex items-center justify-center px-6 py-3 rounded-lg font-semibold bg-pink-50 text-pink-700 hover:bg-pink-100 transition-colors border border-pink-200 text-sm"
            >
              <QrCode className="w-4 h-4 mr-2" /> Show QR Code
            </button>
          </div>

          {/* Submit official result */}
          <div className="bg-white rounded-xl shadow-md p-6 border border-slate-100 flex flex-col items-center text-center">
            <h4 className="font-bold text-slate-800 mb-2">Help Validate Our AI</h4>
            <p className="text-slate-500 text-sm mb-6">
              Have you recently taken the official {examType} exam? Submit your official score report text to help improve this generator.
            </p>
            <button
              onClick={onShowFeedback}
              className="w-full flex items-center justify-center px-6 py-4 rounded-lg font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors border border-indigo-200"
            >
              <Award className="w-5 h-5 mr-2" /> Submit Official Result
            </button>
          </div>

          {/* Pass / Fail CTA */}
          {passed ? (
            <div className="bg-white rounded-xl shadow-md p-6 border border-emerald-100 flex flex-col justify-center items-center text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
                <BadgeCheck className="w-8 h-8 text-emerald-600" />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 text-lg">You're Ready — Go for It!</h4>
                <p className="text-slate-500 text-sm mt-1">Mock score clears 70%. Consider booking the real exam while the material is fresh.</p>
              </div>
              {bp && (
                <a href={bp.scheduleUrl} target="_blank" rel="noopener noreferrer"
                  className="w-full flex items-center justify-center px-6 py-4 rounded-lg font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-md"
                >
                  <CalendarCheck className="w-5 h-5 mr-2" /> Schedule the Real Exam
                </a>
              )}
              <button onClick={onRetry}
                className="w-full flex items-center justify-center px-6 py-3 rounded-lg font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
              >
                <RotateCcw className="w-4 h-4 mr-2" /> Practice Again
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-md p-6 border border-slate-100 flex flex-col justify-center items-center text-center space-y-4">
              <div className="bg-slate-50 rounded-lg w-full p-5">
                <AlertTriangle className="w-10 h-10 mx-auto text-orange-400 mb-3" />
                <h4 className="font-bold text-slate-800 mb-1">Keep Studying</h4>
                <p className="text-slate-600 text-sm">
                  Focus on the topics above, especially those with multiple errors. Real exams require precise knowledge of UI locations and exact syntax.
                </p>
              </div>
              {bp && (
                <a href={bp.blueprintUrl} target="_blank" rel="noopener noreferrer"
                  className="w-full flex items-center justify-center px-6 py-3 rounded-lg font-semibold bg-pink-50 text-pink-700 hover:bg-pink-100 transition-colors border border-pink-200 text-sm"
                >
                  <FileText className="w-4 h-4 mr-2" /> Review Official Blueprint PDF
                </a>
              )}
              <button onClick={onRetry}
                className="w-full flex items-center justify-center px-6 py-4 rounded-lg font-bold bg-slate-800 text-white hover:bg-slate-900 transition-colors"
              >
                <RotateCcw className="w-5 h-5 mr-2" /> Try Again
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Wrong Answer Review ── */}
      {wrongAnswers.length > 0 && (
        <div className="bg-white rounded-2xl shadow-md border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <XCircle className="w-6 h-6 text-red-500" />
                Wrong Answer Review
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                {wrongAnswers.length} missed question{wrongAnswers.length !== 1 ? 's' : ''} — click{' '}
                <span className="font-semibold text-indigo-600">Why?</span> on any question for an AI explanation
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold px-3 py-2 rounded-lg">
              <Zap className="w-3.5 h-3.5" /> AI-Powered Explanations
            </div>
          </div>
          <div className="p-6 space-y-4">
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
        </div>
      )}
    </div>
  );
}
