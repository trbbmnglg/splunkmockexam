import { useState } from 'react';
import { ChevronUp, ChevronDown, CheckCircle, XCircle, AlertTriangle, BookOpen, Star, ExternalLink, Zap } from 'lucide-react';
import { fetchExplanation } from '../utils/agentExplainer';

export default function WrongAnswerCard({
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
}) {
  const [state, setState] = useState('idle');
  const [explanation, setExplanation] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [open, setOpen] = useState(false);

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

  // Use the URL returned by the explainer (may be RAG-retrieved) or fall back to prop
  const docsUrl = explanation?.docSource || docSource ||
    `https://docs.splunk.com/Documentation/Splunk/latest/Search?q=${encodeURIComponent(topic)}`;

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
      <div className="p-4 bg-white">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-grow min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
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
            <p className="text-sm font-medium text-slate-800 leading-relaxed">{question}</p>
            <div className="mt-3 space-y-1.5">
              <div className="flex items-start gap-2">
                <XCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <span className="text-xs text-red-700 leading-relaxed">
                  <span className="font-semibold">You answered:</span> {yourAnswer}
                </span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-xs text-green-700 leading-relaxed">
                  <span className="font-semibold">Correct answer:</span> {correctAnswer}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={handleExpand}
            className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all border ${
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
        </div>
      </div>

      {open && state === 'loading' && (
        <div className="px-4 pb-4 pt-1 bg-indigo-50/50 border-t border-slate-100">
          <div className="flex items-center gap-2 text-indigo-600 text-sm">
            <div className="w-4 h-4 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin flex-shrink-0" />
            <span>Retrieving docs &amp; generating explanation...</span>
          </div>
        </div>
      )}

      {open && state === 'error' && (
        <div className="px-4 pb-4 pt-1 bg-red-50 border-t border-red-100">
          <div className="flex items-center gap-2 text-red-600 text-sm">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
            <button onClick={handleRetry} className="ml-auto text-xs underline hover:no-underline">Retry</button>
          </div>
        </div>
      )}

      {open && state === 'done' && explanation && (
        <div className="px-4 pb-4 pt-3 bg-gradient-to-b from-indigo-50/60 to-white border-t border-indigo-100 space-y-3 animate-fade-in">

          {/* RAG grounded indicator */}
          {explanation.ragGrounded && (
            <div className="flex items-center gap-1.5 text-xs text-teal-700 bg-teal-50 border border-teal-100 rounded-md px-2.5 py-1.5">
              <Zap className="w-3 h-3 flex-shrink-0" />
              Grounded in official Splunk documentation
            </div>
          )}

          <p className="text-sm text-slate-700 leading-relaxed">{explanation.explanation}</p>

          {explanation.keyTakeaway && (
            <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3">
              <Star className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs font-medium text-amber-800 leading-relaxed">{explanation.keyTakeaway}</p>
            </div>
          )}

          {explanation.docHint && (
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <BookOpen className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{explanation.docHint}</span>
              <a
                href={docsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-auto flex items-center gap-1 text-pink-600 hover:text-pink-800 font-semibold transition-colors flex-shrink-0"
              >
                Open Docs <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
