import {
  Clock, CheckCircle, AlertTriangle, ChevronRight, ChevronLeft,
  BookOpen, Flag, X, LayoutGrid, AlertCircle, Infinity, RefreshCw,
} from 'lucide-react';

export default function ExamScreen({
  questions,
  currentQuestionIndex,
  setCurrentQuestionIndex,
  userAnswers,
  handleAnswerSelect,
  flaggedQuestions,
  setFlaggedQuestions,
  examConfig,
  timeRemaining,
  isReviewMode,
  showCancelModal,
  setShowCancelModal,
  showGrid,
  setShowGrid,
  finishExam,
  onCancelToMenu,
  formatTime,
}) {
  const q = questions[currentQuestionIndex];

  if (!q) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] animate-fade-in">
        <AlertTriangle className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-slate-800">Error Loading Question</h2>
        <p className="text-slate-600 mt-2 mb-6">The generated exam data could not be parsed properly.</p>
        <button onClick={onCancelToMenu} className="px-6 py-3 font-bold bg-slate-800 text-white hover:bg-slate-900 rounded transition-colors shadow-md">
          Return to Menu
        </button>
      </div>
    );
  }

  const unansweredCount = questions.length - Object.keys(userAnswers).length;
  const canSubmit = unansweredCount === 0;

  const prevQuestion = () => setCurrentQuestionIndex(prev => prev > 0 ? prev - 1 : prev);
  const nextQuestion = () => setCurrentQuestionIndex(prev => prev < questions.length - 1 ? prev + 1 : prev);

  return (
    <div className="max-w-4xl mx-auto w-full animate-fade-in pb-20 relative">

      {/* Review mode banner */}
      {isReviewMode && (
        <div className="mb-4 flex items-center gap-2 bg-orange-50 border border-orange-200 text-orange-700 text-sm font-semibold px-4 py-2.5 rounded-lg">
          <RefreshCw className="w-4 h-4 flex-shrink-0" />
          Review Session — Mixed missed questions + fresh AI questions on your weak topics
        </div>
      )}

      {/* Cancel confirmation modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white p-6 max-w-md w-full shadow-2xl animate-fade-in rounded-lg">
            <h3 className="text-xl font-bold text-slate-800 mb-2">Cancel Exam?</h3>
            <p className="text-slate-600 mb-6">Are you sure you want to cancel? All your current progress will be lost.</p>
            <div className="flex space-x-4">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-semibold transition-colors"
              >
                Resume
              </button>
              <button
                onClick={onCancelToMenu}
                className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded font-semibold transition-colors"
              >
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Question navigator grid modal */}
      {showGrid && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[60] p-4 flex flex-col items-center justify-center"
          onClick={() => setShowGrid(false)}
        >
          <div
            className="bg-white p-6 max-w-2xl w-full shadow-2xl animate-fade-in rounded-lg"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-xl font-bold text-slate-800">Question Navigator</h3>
                <p className="text-sm text-slate-500">{unansweredCount} remaining</p>
              </div>
              <button onClick={() => setShowGrid(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <X className="w-6 h-6 text-slate-500" />
              </button>
            </div>
            <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-3 max-h-[50vh] overflow-y-auto p-1 pr-2">
              {questions.map((_, idx) => {
                const isAns = userAnswers[idx] !== undefined;
                const isFlagged = flaggedQuestions[idx];
                const isCurrent = currentQuestionIndex === idx;
                return (
                  <button
                    key={idx}
                    onClick={() => { setCurrentQuestionIndex(idx); setShowGrid(false); }}
                    className={`relative w-10 h-10 font-semibold flex items-center justify-center transition-all rounded
                      ${isCurrent ? 'ring-2 ring-pink-500 ring-offset-2' : ''}
                      ${isAns ? 'bg-pink-600 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}
                    `}
                  >
                    {idx + 1}
                    {isFlagged && (
                      <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-yellow-400 border-2 border-white rounded-full shadow-sm" />
                    )}
                  </button>
                );
              })}
            </div>
            <div className="mt-6 flex flex-wrap gap-4 text-sm text-slate-600 justify-center bg-slate-50 p-3 rounded">
              <div className="flex items-center"><div className="w-3 h-3 bg-pink-600 rounded-sm mr-2" /> Answered</div>
              <div className="flex items-center"><div className="w-3 h-3 bg-slate-200 rounded-sm mr-2" /> Unanswered</div>
              <div className="flex items-center"><div className="w-3 h-3 bg-yellow-400 rounded-full mr-2" /> Flagged</div>
            </div>
          </div>
        </div>
      )}

      {/* Sticky top bar */}
      <div className="bg-white shadow-sm border border-slate-100 p-4 rounded-lg mb-6 flex flex-col md:flex-row items-center justify-between sticky top-4 z-10 gap-4">
        <div className="flex items-center space-x-2 w-full md:w-auto">
          <button
            onClick={() => setShowCancelModal(true)}
            className="p-2 text-slate-400 hover:text-red-500 rounded-full hover:bg-red-50 transition-colors"
            title="Cancel Exam"
          >
            <X className="w-6 h-6" />
          </button>
          <div className="h-6 w-px bg-slate-200 mx-2" />
          <button
            onClick={() => setShowGrid(true)}
            className="flex items-center px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded font-medium transition-colors border border-slate-200"
          >
            <LayoutGrid className="w-5 h-5 mr-2 text-slate-500" />
            <span className="hidden sm:inline">Navigator</span>
          </button>
        </div>

        <div className="flex items-center space-x-3 text-center">
          <span className="bg-pink-100 text-pink-700 font-bold px-4 py-2 rounded-full">
            Question {currentQuestionIndex + 1} of {questions.length}
          </span>
        </div>

        <div className={`flex items-center space-x-2 font-mono text-xl font-bold px-4 py-2 rounded-lg w-full md:w-auto justify-center
          ${!examConfig.useTimer
            ? 'bg-slate-50 text-slate-500'
            : timeRemaining < 300
              ? 'bg-red-50 text-red-600 animate-pulse'
              : 'bg-slate-50 text-slate-700'
          }`}
        >
          {examConfig.useTimer ? (
            <><Clock className="w-5 h-5" /><span>{formatTime(timeRemaining)}</span></>
          ) : (
            <><Infinity className="w-6 h-6" /><span className="text-sm uppercase tracking-wider font-sans ml-1">Untimed</span></>
          )}
        </div>
      </div>

      {/* Answer progress bar */}
      <div className="w-full bg-slate-200 h-2 rounded-full mb-6 overflow-hidden">
        <div
          className="bg-pink-500 h-full transition-all duration-300 ease-out"
          style={{ width: `${(Object.keys(userAnswers).length / questions.length) * 100}%` }}
        />
      </div>

      {/* Question card */}
      <div className="bg-white shadow-md border border-slate-200 rounded-lg overflow-hidden">
        <div className="p-6 md:p-8 border-b border-slate-100 flex justify-between items-start gap-4">
          <div className="flex-grow min-w-0">
            <h2 className="text-xl md:text-2xl font-semibold text-slate-800 leading-relaxed">{q.question}</h2>
            {q.docSource && (
              <a
                href={q.docSource}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 mt-2 text-xs text-blue-500 hover:text-blue-700 transition-colors"
                onClick={e => e.stopPropagation()}
              >
                <BookOpen className="w-3 h-3" /> Source: Splunk Docs
              </a>
            )}
          </div>
          <button
            onClick={() => setFlaggedQuestions(prev => ({ ...prev, [currentQuestionIndex]: !prev[currentQuestionIndex] }))}
            className={`flex-shrink-0 flex items-center px-3 py-2 text-sm rounded-md font-medium transition-colors border
              ${flaggedQuestions[currentQuestionIndex]
                ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
              }`}
          >
            <Flag className="w-4 h-4 mr-1.5" fill={flaggedQuestions[currentQuestionIndex] ? 'currentColor' : 'none'} />
            <span className="hidden sm:inline">{flaggedQuestions[currentQuestionIndex] ? 'Flagged' : 'Flag'}</span>
          </button>
        </div>

        <div className="p-6 md:p-8 bg-slate-50 space-y-3">
          {q.options && q.options.map((option, idx) => {
            const selected = userAnswers[currentQuestionIndex] === idx;
            return (
              <div
                key={idx}
                onClick={() => handleAnswerSelect(idx)}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 flex items-start space-x-3
                  ${selected
                    ? 'border-pink-500 bg-pink-50 shadow-sm'
                    : 'border-slate-200 bg-white hover:border-pink-300 hover:bg-pink-50/50'
                  }`}
              >
                <div className={`mt-1 flex-shrink-0 w-5 h-5 border-2 rounded-full flex items-center justify-center
                  ${selected ? 'border-pink-600' : 'border-slate-300'}`}
                >
                  {selected && <div className="w-2.5 h-2.5 bg-pink-600 rounded-full" />}
                </div>
                <span className={`text-lg ${selected ? 'text-pink-900 font-medium' : 'text-slate-700'}`}>{option}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Prev / Next / Submit buttons */}
      <div className="flex items-center justify-between mt-8 relative">
        <button
          onClick={prevQuestion}
          disabled={currentQuestionIndex === 0}
          className={`flex items-center px-6 py-3 rounded font-semibold transition-colors
            ${currentQuestionIndex === 0
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200 shadow-sm'
            }`}
        >
          <ChevronLeft className="w-5 h-5 mr-2" />
          <span className="hidden sm:inline">Previous</span>
        </button>

        {currentQuestionIndex === questions.length - 1 ? (
          <div className="relative flex flex-col items-end">
            {!canSubmit && (
              <div className="absolute -top-8 right-0 text-orange-500 text-sm font-semibold flex items-center bg-orange-50 px-3 py-1 rounded border border-orange-200 whitespace-nowrap">
                <AlertCircle className="w-4 h-4 mr-1.5" />
                {unansweredCount} question{unansweredCount > 1 ? 's' : ''} remaining
              </div>
            )}
            <button
              onClick={finishExam}
              disabled={!canSubmit}
              className={`flex items-center px-8 py-3 rounded font-bold shadow-md transition-all
                ${canSubmit
                  ? 'bg-pink-600 text-white hover:bg-pink-700 hover:scale-105'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
            >
              Submit Exam <CheckCircle className="w-5 h-5 ml-2" />
            </button>
          </div>
        ) : (
          <button
            onClick={nextQuestion}
            className="flex items-center px-8 py-3 rounded font-bold bg-slate-800 text-white hover:bg-slate-900 shadow-md transition-transform hover:scale-105"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="w-5 h-5 ml-2" />
          </button>
        )}
      </div>
    </div>
  );
}
