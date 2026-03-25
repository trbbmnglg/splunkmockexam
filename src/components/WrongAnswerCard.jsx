import { useState, memo } from 'react';
import { ChevronUp, ChevronDown, CheckCircle, XCircle, AlertTriangle, BookOpen, Star, ExternalLink, Zap, Flag } from 'lucide-react';
import { fetchExplanation } from '../utils/agentExplainer';
import { submitQuestionFlag } from '../utils/questionFlags';

const FLAG_REASONS = [
  { value: 'wrong-level',      label: 'Wrong difficulty level' },
  { value: 'off-topic',        label: 'Off-topic for this cert' },
  { value: 'incorrect-answer', label: 'Incorrect answer' },
  { value: 'ambiguous',        label: 'Ambiguous / unclear' },
];

export default memo(function WrongAnswerCard({
  questionIndex,
  question,
  yourAnswer,
  correctAnswer,
  allOptions,
  topic,
  examType,
  blueprintLevel,
  apiKey,
  docSource,
  timesMissed = 1,
  questionHash,
  flagBudget = 3,
  onFlagUsed,
}) {
  const [state, setState] = useState('idle');
  const [explanation, setExplanation] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [open, setOpen] = useState(false);

  // Flag state
  const [showFlagMenu, setShowFlagMenu] = useState(false);
  const [flagState, setFlagState]       = useState('idle'); // idle | submitting | done | error
  const [flagMsg, setFlagMsg]           = useState('');

  const doFetch = async () => {
    setState('loading');
    try {
      const result = await fetchExplanation(
        { question, yourAnswer, correctAnswer, allOptions, topic, examType, blueprintLevel, timesMissed, docSource },
        apiKey
      );
      setExplanation(result);
      setState('done');
    } catch (err) {
      setErrorMsg(err.message);
      setState('error');
    }
  };

  const handleExpand = () => {
    if (open) { setOpen(false); return; }
    setOpen(true);
    if (state === 'idle') doFetch();
  };

  const handleRetry = () => {
    setErrorMsg('');
    doFetch();
  };

  const handleFlag = async (reason) => {
    setFlagState('submitting');
    setShowFlagMenu(false);
    const result = await submitQuestionFlag({
      examType, questionHash, question, topic, reason,
    });
    setFlagMsg(result.message);
    setFlagState(result.accepted ? 'done' : 'error');
    if (result.accepted && onFlagUsed) onFlagUsed();
  };

  const ragUrl = explanation?.docSource;
  const fallbackDocSource = explanation?.ragGrounded ? '' : (docSource || '');
  const docsUrl =
    ragUrl ||
    fallbackDocSource ||
    `https://docs.splunk.com/Documentation/Splunk/latest/Search?q=${encodeURIComponent(topic)}`;

  // Depth label colour
  const depthMeta = {
    basic:    { label: 'Basic explanation',          bg: 'bg-slate-100',   text: 'text-slate-500'   },
    detailed: { label: 'Detailed explanation',       bg: 'bg-orange-50',   text: 'text-orange-600'  },
    deep:     { label: 'Deep first-principles',      bg: 'bg-red-50',      text: 'text-red-600'     },
  };
  const depth = explanation?.depthTier ? depthMeta[explanation.depthTier] : null;

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">

      {/* ── Question header ── */}
      <div className="p-4 bg-white">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-grow min-w-0">

            {/* Meta row */}
            <div className="flex items-center gap-2 mb-2.5 flex-wrap">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Q{questionIndex + 1}</span>
              <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium truncate">{topic}</span>
              {timesMissed >= 3 && (
                <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-semibold flex-shrink-0">
                  Missed {timesMissed}× — deep explanation
                </span>
              )}
              {timesMissed === 2 && (
                <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-semibold flex-shrink-0">
                  Missed {timesMissed}× — detailed explanation
                </span>
              )}
            </div>

            {/* Question text */}
            <p className="text-sm font-medium text-slate-800 leading-relaxed mb-3">{question}</p>

            {/* Answer comparison */}
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <XCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                <span className="text-xs text-slate-600 leading-relaxed">
                  <span className="font-semibold text-red-600">You answered:</span> {yourAnswer}
                </span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                <span className="text-xs text-slate-600 leading-relaxed">
                  <span className="font-semibold text-emerald-600">Correct answer:</span> {correctAnswer}
                </span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col gap-1.5 flex-shrink-0">
            <button
              onClick={handleExpand}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all border ${
                open
                  ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200'
              }`}
            >
              {state === 'loading' ? (
                <><div className="w-3 h-3 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" /> Explaining...</>
              ) : (
                <>{open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />} {open ? 'Hide' : 'Why?'}</>
              )}
            </button>

            {/* Flag button */}
            {flagState === 'idle' && flagBudget > 0 && (
              <div className="relative">
                <button
                  onClick={() => setShowFlagMenu(v => !v)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all border bg-slate-50 text-slate-500 border-slate-200 hover:bg-amber-50 hover:text-amber-600 hover:border-amber-200 w-full"
                  title="Flag this question"
                >
                  <Flag className="w-3 h-3" /> Flag
                </button>
                {showFlagMenu && (
                  <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-slate-200 z-20 w-52 py-1 animate-fade-in">
                    {FLAG_REASONS.map(r => (
                      <button
                        key={r.value}
                        onClick={() => handleFlag(r.value)}
                        className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-amber-50 hover:text-amber-700 transition-colors"
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            {flagState === 'submitting' && (
              <div className="flex items-center gap-1.5 px-3 py-2 text-xs text-slate-400">
                <div className="w-3 h-3 border-2 border-slate-300 border-t-slate-500 rounded-full animate-spin" />
                Flagging...
              </div>
            )}
            {flagState === 'done' && (
              <div className="flex items-center gap-1.5 px-3 py-2 text-xs text-emerald-600 font-medium">
                <CheckCircle className="w-3 h-3" /> Flagged
              </div>
            )}
            {flagState === 'error' && (
              <div className="px-3 py-2 text-xs text-red-500">{flagMsg}</div>
            )}
          </div>
        </div>
      </div>

      {/* ── Loading ── */}
      {open && state === 'loading' && (
        <div className="px-4 pb-4 pt-3 bg-indigo-50/40 border-t border-indigo-100">
          <div className="flex items-center gap-2 text-indigo-600 text-sm">
            <div className="w-4 h-4 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin flex-shrink-0" />
            <span>Retrieving docs &amp; generating explanation...</span>
          </div>
        </div>
      )}

      {/* ── Error ── */}
      {open && state === 'error' && (
        <div className="px-4 pb-4 pt-3 bg-red-50 border-t border-red-100">
          <div className="flex items-center gap-2 text-red-600 text-sm">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span className="flex-grow">{errorMsg}</span>
            <button onClick={handleRetry} className="text-xs underline hover:no-underline flex-shrink-0">Retry</button>
          </div>
        </div>
      )}

      {/* ── Explanation ── */}
      {open && state === 'done' && explanation && (
        <div className="border-t border-indigo-100 animate-fade-in">

          {/* Top meta bar */}
          <div className="px-4 pt-3 pb-2 bg-indigo-50/50 flex items-center gap-2 flex-wrap">
            {explanation.ragGrounded && (
              <div className="flex items-center gap-1.5 text-xs text-teal-700 bg-teal-50 border border-teal-100 rounded-md px-2.5 py-1">
                <Zap className="w-3 h-3 flex-shrink-0" />
                Grounded in official Splunk documentation
              </div>
            )}
            {depth && (
              <div className={`flex items-center text-xs font-medium px-2.5 py-1 rounded-md ${depth.bg} ${depth.text}`}>
                {depth.label}
              </div>
            )}
          </div>

          {/* Explanation body */}
          <div className="px-4 pb-4 pt-2 bg-gradient-to-b from-indigo-50/30 to-white space-y-3">
            <p className="text-sm text-slate-700 leading-[1.75]">{explanation.explanation}</p>

            {explanation.keyTakeaway && (
              <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-lg p-3">
                <Star className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs font-medium text-amber-800 leading-relaxed">{explanation.keyTakeaway}</p>
              </div>
            )}

            {explanation.docHint && (
              <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                <BookOpen className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                <span className="text-xs text-slate-500 flex-grow leading-relaxed">{explanation.docHint}</span>
                <a
                  href={docsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-pink-600 hover:text-pink-800 font-semibold transition-colors flex-shrink-0"
                >
                  Open Docs <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
});
