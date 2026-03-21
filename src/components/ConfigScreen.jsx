import { Settings, X, ChevronRight, ListChecks, Clock, BookOpen, Cpu, Key, Lock, CheckCircle, ShieldCheck, Globe, Zap, RotateCcw, ExternalLink, Target, GraduationCap, Focus } from 'lucide-react';
import { TOPICS, EXAM_BLUEPRINTS, API_KEY_URLS, CURRENT_YEAR, YEAR_RANGE } from '../utils/constants';
import { DEFAULT_GROQ_KEY } from '../utils/api';
import { computeExamReadiness } from '../utils/agentAdaptive';
import BlueprintPanel from './BlueprintPanel';

export default function ConfigScreen({
  examType,
  examConfig,
  setExamConfig,
  apiKeys,
  updateApiKey,
  userEditedPrompt,
  setUserEditedPrompt,
  buildAgenticPrompt,
  showAdvanced,
  setShowAdvanced,
  onBack,
  onStart,
  usageInfo,
}) {
  const toggleTopic = (topic) => {
    setExamConfig(prev => {
      const selected = prev.selectedTopics.includes(topic)
        ? prev.selectedTopics.filter(t => t !== topic)
        : [...prev.selectedTopics, topic];
      return { ...prev, selectedTopics: selected };
    });
  };

  // ── Usage indicator ────────────────────────────────────────────────────────
  const showUsage     = usageInfo !== null && usageInfo !== undefined;
  const remaining     = usageInfo?.remaining ?? 0;
  const usageExceeded = usageInfo?.exceeded ?? false;

  const usageColor = usageExceeded
    ? 'bg-red-50 border-red-200 text-red-700'
    : remaining <= 2
      ? 'bg-amber-50 border-amber-200 text-amber-700'
      : 'bg-green-50 border-green-200 text-green-700';

  const usageDotColor = usageExceeded ? 'bg-red-500' : remaining <= 2 ? 'bg-amber-500' : 'bg-green-500';

  const resetTime = usageInfo?.resetAt
    ? new Date(usageInfo.resetAt).toLocaleTimeString('en-US', {
        hour: '2-digit', minute: '2-digit', timeZoneName: 'short', timeZone: 'UTC',
      })
    : 'midnight UTC';

  // ── Readiness score ────────────────────────────────────────────────────────
  const bp            = examType ? EXAM_BLUEPRINTS[examType] : null;
  const readiness     = computeExamReadiness(examType, bp?.topics);
  const showReadiness = readiness && readiness.sessions > 0;

  return (
    <div className="max-w-3xl mx-auto w-full animate-fade-in bg-white shadow-xl p-6 md:p-10 border border-slate-100 rounded-lg">
      <div className="flex items-center justify-between mb-8 border-b border-slate-100 pb-6">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-800 flex items-center">
            <Settings className="w-8 h-8 mr-3 text-pink-500" />
            Exam Configuration
          </h2>
          <p className="text-slate-500 mt-2 font-medium">Customizing for: <span className="text-pink-600">{examType}</span></p>
        </div>
        <button onClick={onBack} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors rounded-full">
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* ── Usage indicator ── */}
      {showUsage && (
        <div className={`flex items-center justify-between p-3 rounded-lg border mb-4 text-sm font-medium ${usageColor}`}>
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${usageDotColor}`} />
            {usageExceeded
              ? `Daily limit reached — resets at ${resetTime}`
              : `${remaining} of ${usageInfo.limit} free exam${usageInfo.limit !== 1 ? 's' : ''} remaining today`
            }
          </div>
          {(usageExceeded || remaining <= 3) && (
            <a href="https://console.groq.com/keys" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs font-semibold underline underline-offset-2 hover:no-underline flex-shrink-0 ml-3"
            >
              Get free API key <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      )}

      {/* ── Readiness score indicator ── */}
      {showReadiness && (
        <div className={`flex items-center justify-between p-3 rounded-lg border mb-6 ${readiness.labelBg}`}>
          <div className="flex items-center gap-2.5 min-w-0">
            <Target className={`w-4 h-4 flex-shrink-0 ${readiness.labelColor}`} />
            <div className="min-w-0">
              <span className={`text-sm font-bold ${readiness.labelColor}`}>
                Readiness: {readiness.score}%
              </span>
              <span className="text-xs text-slate-500 ml-2">
                ({readiness.coveredPct}% covered · {readiness.sessions} session{readiness.sessions !== 1 ? 's' : ''})
              </span>
              {readiness.graduatedCount > 0 && (
                <span className="text-xs text-emerald-600 font-semibold ml-2">
                  · {readiness.graduatedCount} mastered 🎓
                </span>
              )}
            </div>
          </div>
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full border flex-shrink-0 ml-3 ${readiness.labelBg} ${readiness.labelColor}`}>
            {readiness.label}
          </span>
        </div>
      )}

      <div className="space-y-8">
        {examType && EXAM_BLUEPRINTS[examType] && (
          <BlueprintPanel bp={EXAM_BLUEPRINTS[examType]} />
        )}

        {/* Number of questions */}
        <div>
          <h3 className="text-lg font-bold text-slate-800 mb-3 flex items-center">
            <ListChecks className="w-5 h-5 mr-2 text-slate-500" /> Number of Questions
          </h3>
          <div className="flex flex-wrap gap-3">
            {[5, 10, 15, 20, 25, 30].map(num => (
              <button
                key={num}
                onClick={() => setExamConfig(prev => ({ ...prev, numQuestions: num }))}
                className={`px-6 py-3 font-bold transition-all rounded ${examConfig.numQuestions === num ? 'bg-slate-800 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                {num}
              </button>
            ))}
          </div>
        </div>

        {/* Timer */}
        <div>
          <h3 className="text-lg font-bold text-slate-800 mb-3 flex items-center">
            <Clock className="w-5 h-5 mr-2 text-slate-500" /> Exam Timer
          </h3>
          <label className="flex items-center cursor-pointer p-4 border-2 border-slate-100 hover:border-slate-300 transition-colors bg-white rounded-lg">
            <div className="relative">
              <input type="checkbox" className="sr-only" checked={examConfig.useTimer}
                onChange={(e) => setExamConfig(prev => ({ ...prev, useTimer: e.target.checked }))} />
              <div className={`block w-14 h-8 transition-colors rounded-full ${examConfig.useTimer ? 'bg-slate-800' : 'bg-slate-300'}`} />
              <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${examConfig.useTimer ? 'transform translate-x-6' : ''}`} />
            </div>
            <div className="ml-4">
              <div className="font-semibold text-slate-800">{examConfig.useTimer ? 'Timer Enabled' : 'Untimed Practice'}</div>
              <div className="text-sm text-slate-500 mt-0.5 leading-relaxed">{examConfig.useTimer ? 'A strict countdown timer will run based on question count.' : 'Take your time without any pressure.'}</div>
            </div>
          </label>
        </div>

        {/* Focus Mode */}
        <div>
          <h3 className="text-lg font-bold text-slate-800 mb-3 flex items-center">
            <Focus className="w-5 h-5 mr-2 text-slate-500" /> Focus Mode
          </h3>
          <label className="flex items-center cursor-pointer p-4 border-2 border-slate-100 hover:border-slate-300 transition-colors bg-white rounded-lg">
            <div className="relative">
              <input type="checkbox" className="sr-only" checked={!!examConfig.focusMode}
                onChange={(e) => setExamConfig(prev => ({ ...prev, focusMode: e.target.checked }))} />
              <div className={`block w-14 h-8 transition-colors rounded-full ${examConfig.focusMode ? 'bg-indigo-600' : 'bg-slate-300'}`} />
              <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${examConfig.focusMode ? 'transform translate-x-6' : ''}`} />
            </div>
            <div className="ml-4 flex-grow">
              <div className="font-semibold text-slate-800 flex items-center gap-2">
                {examConfig.focusMode ? 'Focus Mode On' : 'Focus Mode Off'}
                {examConfig.focusMode && (
                  <span className="text-xs font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">Active</span>
                )}
              </div>
              <div className="text-sm text-slate-500 mt-0.5 leading-relaxed">
                Hides the nav and dims everything outside the question card. Exit with the <kbd className="text-xs bg-slate-100 border border-slate-200 rounded px-1.5 py-0.5 font-mono">Esc</kbd> key or the Exit Focus button.
              </div>
            </div>
          </label>
        </div>

        {/* Topic Coverage */}
        <div>
          <div className="flex justify-between items-end mb-3">
            <h3 className="text-lg font-bold text-slate-800 flex items-center">
              <BookOpen className="w-5 h-5 mr-2 text-slate-500" /> Topic Coverage
            </h3>
            <div className="flex space-x-3">
              <button onClick={() => setExamConfig(prev => ({ ...prev, selectedTopics: TOPICS[examType] }))} className="text-sm text-pink-600 hover:text-pink-800 font-semibold">Select All</button>
              <span className="text-slate-300">|</span>
              <button onClick={() => setExamConfig(prev => ({ ...prev, selectedTopics: [] }))} className="text-sm text-slate-500 hover:text-slate-700 font-semibold">Clear All</button>
            </div>
          </div>
          <p className="text-sm text-slate-500 mb-4 leading-relaxed">If no topics are selected, the exam will cover all topics randomly.</p>

          <div className="grid sm:grid-cols-2 gap-2.5 max-h-72 overflow-y-auto p-1 pr-2">
            {TOPICS[examType].map((topic, idx) => {
              const isSelected     = examConfig.selectedTopics.includes(topic);
              const topicReadiness = readiness?.breakdown?.find(t => t.name === topic);
              const hasData        = topicReadiness?.attempted;
              const accuracy       = topicReadiness?.accuracy;
              const isGraduated    = !!(topicReadiness?.graduated);

              return (
                <div
                  key={idx}
                  onClick={() => toggleTopic(topic)}
                  className={`px-3 py-3 border rounded-lg cursor-pointer transition-all flex items-start gap-3 ${
                    isGraduated
                      ? isSelected
                        ? 'bg-emerald-50 border-emerald-400'
                        : 'bg-emerald-50/50 border-emerald-200 hover:border-emerald-400'
                      : isSelected
                        ? 'bg-pink-50 border-pink-400'
                        : 'bg-white border-slate-200 hover:border-pink-300'
                  }`}
                >
                  <div className={`mt-0.5 flex-shrink-0 w-5 h-5 border rounded flex items-center justify-center transition-colors ${
                    isGraduated && isSelected ? 'bg-emerald-500 border-emerald-500' :
                    isSelected                ? 'bg-pink-500 border-pink-500'       :
                                                'border-slate-300'
                  }`}>
                    {isSelected && (isGraduated
                      ? <GraduationCap className="w-3 h-3 text-white" />
                      : <CheckCircle className="w-3.5 h-3.5 text-white" />
                    )}
                  </div>

                  <div className="flex-grow min-w-0">
                    <div className="flex items-center gap-1.5 mb-1">
                      {isGraduated && <GraduationCap className="w-3 h-3 text-emerald-500 flex-shrink-0" />}
                      <span className={`text-sm font-medium leading-snug ${
                        isGraduated ? 'text-emerald-800' :
                        isSelected  ? 'text-pink-900'    :
                                      'text-slate-700'
                      }`}>{topic}</span>
                    </div>

                    {isGraduated ? (
                      <span className="text-xs text-emerald-600 font-medium">
                        Mastered 🎓 — 1 question (maintenance)
                      </span>
                    ) : hasData ? (
                      <div className="flex items-center gap-2 mt-1.5">
                        <div className="flex-grow h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              accuracy >= 80 ? 'bg-emerald-400' :
                              accuracy >= 60 ? 'bg-blue-400'    :
                              accuracy >= 40 ? 'bg-amber-400'   :
                                              'bg-red-400'
                            }`}
                            style={{ width: `${accuracy}%` }}
                          />
                        </div>
                        <span className={`text-xs font-semibold flex-shrink-0 ${
                          accuracy >= 80 ? 'text-emerald-600' :
                          accuracy >= 60 ? 'text-blue-600'    :
                          accuracy >= 40 ? 'text-amber-600'   :
                                          'text-red-600'
                        }`}>{accuracy}%</span>
                      </div>
                    ) : showReadiness ? (
                      <span className="text-xs text-slate-400 mt-0.5 block">not yet attempted</span>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Advanced */}
        <div className="pt-6 border-t border-slate-200">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center justify-between w-full text-left font-bold text-slate-700 hover:text-pink-600 transition-colors"
          >
            <span className="flex items-center"><Settings className="w-5 h-5 mr-2" /> Advanced Setup (Generators)</span>
            {showAdvanced
              ? <ChevronRight className="w-5 h-5 text-slate-400 rotate-90 transition-transform" />
              : <ChevronRight className="w-5 h-5 text-slate-400 transition-transform" />
            }
          </button>

          {showAdvanced && (
            <div className="mt-6 bg-slate-50 p-6 border border-slate-200 rounded animate-fade-in shadow-inner space-y-6">
              <div>
                <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center uppercase tracking-wider">
                  <Cpu className="w-4 h-4 mr-2 text-pink-500" /> AI Generator Engine
                </h3>
                <div className="flex flex-wrap gap-2 mb-4">
                  {[
                    { id: 'llama',      label: 'Meta (Llama 3.3 via Groq)' },
                    { id: 'perplexity', label: 'Perplexity (Live Web Search)' },
                    { id: 'gemini',     label: 'Google (Gemini 1.5 Flash)' },
                    { id: 'qwen',       label: 'Alibaba (Qwen 2.5 via OpenRouter)' },
                  ].map(provider => (
                    <button
                      key={provider.id}
                      onClick={() => setExamConfig(prev => ({ ...prev, aiProvider: provider.id }))}
                      className={`px-3 py-2 flex items-center text-sm font-semibold transition-all border rounded ${examConfig.aiProvider === provider.id ? 'bg-pink-100 border-pink-500 text-pink-700 shadow-sm' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                    >
                      {provider.id === 'perplexity' && <Globe className="w-3.5 h-3.5 mr-1.5" />}
                      {provider.label}
                    </button>
                  ))}
                </div>

                <div className="relative animate-fade-in">
                  <div className="flex justify-between items-end mb-2">
                    <label className="block text-sm font-semibold text-slate-700 flex items-center">
                      <Key className="w-4 h-4 mr-1.5" /> {examConfig.aiProvider.toUpperCase()} API Key
                    </label>
                    <a href={API_KEY_URLS[examConfig.aiProvider]} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center">
                      Get API Key <ExternalLink className="w-3 h-3 ml-1" />
                    </a>
                  </div>
                  <div className={`flex items-center border rounded focus-within:ring-1 transition-all overflow-hidden ${examConfig.aiProvider === 'llama' && !apiKeys['llama'] ? 'bg-green-50 border-green-300 focus-within:border-green-500 focus-within:ring-green-300' : 'bg-white border-slate-300 focus-within:border-pink-500 focus-within:ring-pink-500'}`}>
                    <span className="pl-3 text-slate-400"><Lock className="w-4 h-4" /></span>
                    <input
                      type="password"
                      value={apiKeys[examConfig.aiProvider] || ''}
                      onChange={(e) => updateApiKey(examConfig.aiProvider, e.target.value)}
                      placeholder={examConfig.aiProvider === 'llama' ? '✓ Default Groq key pre-loaded — or paste your own to override' : `Paste your ${examConfig.aiProvider} API key here...`}
                      className="w-full p-3 outline-none text-slate-700 bg-transparent font-mono text-sm"
                    />
                  </div>
                  {examConfig.aiProvider === 'llama' && !apiKeys['llama'] ? (
                    <p className="text-xs text-green-700 mt-2 flex items-center font-medium bg-green-50 p-2 border border-green-200 rounded leading-relaxed">
                      <CheckCircle className="w-4 h-4 mr-1.5 flex-shrink-0" /> A shared Groq key is pre-configured. You can start the exam immediately, or paste your own key for higher rate limits and quality validation.
                    </p>
                  ) : (
                    <p className="text-xs text-green-700 mt-2 flex items-center font-medium bg-green-50 p-2 border border-green-200 rounded leading-relaxed">
                      <ShieldCheck className="w-4 h-4 mr-1.5 flex-shrink-0" /> Security Note: Your key is stored securely in your browser's local storage and is never sent to our servers.
                    </p>
                  )}
                </div>

                {examConfig.aiProvider === 'perplexity' && (
                  <div className="bg-purple-50 text-purple-800 p-3 mt-3 text-sm flex items-start border border-purple-200 rounded leading-relaxed">
                    <Globe className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
                    <p>Perplexity AI explicitly searches the live web to combine the latest {YEAR_RANGE} official Splunk documentation to ensure maximum accuracy.</p>
                  </div>
                )}
              </div>

              <div className="border-t border-slate-200 pt-6">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center uppercase tracking-wider">
                    <Zap className="w-4 h-4 mr-2 text-pink-500" /> Agentic Prompt Engine
                  </h3>
                  {userEditedPrompt && (
                    <button
                      onClick={() => {
                        setUserEditedPrompt(false);
                        setExamConfig(prev => ({
                          ...prev,
                          customPrompt: buildAgenticPrompt(examType, prev.numQuestions, prev.selectedTopics, prev.aiProvider),
                        }));
                      }}
                      className="text-xs text-pink-600 hover:text-pink-800 flex items-center font-bold transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5 mr-1" /> Reset to Dynamic Default
                    </button>
                  )}
                </div>
                <p className="text-xs text-slate-500 mb-3 leading-relaxed">
                  This prompt is dynamically updated based on your selections above. Feel free to edit it manually to force specific difficulty levels, tricky scenarios, or version focus (like {CURRENT_YEAR} standards).
                </p>
                <textarea
                  value={examConfig.customPrompt}
                  onChange={(e) => {
                    setUserEditedPrompt(true);
                    setExamConfig(prev => ({ ...prev, customPrompt: e.target.value }));
                  }}
                  className={`w-full h-56 p-4 border rounded focus:border-pink-500 focus:ring-1 focus:ring-pink-500 outline-none text-sm text-slate-700 font-mono leading-relaxed resize-y shadow-inner ${userEditedPrompt ? 'bg-yellow-50/30 border-yellow-300' : 'bg-slate-100/50 border-slate-300'}`}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-10 flex space-x-4">
        <button onClick={onBack} className="px-6 py-4 font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors rounded">Back</button>
        <button
          onClick={onStart}
          disabled={usageExceeded}
          className={`flex-1 flex items-center justify-center px-6 py-4 font-bold rounded transition-transform shadow-lg
            ${usageExceeded
              ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
              : 'bg-pink-600 text-white hover:bg-pink-700 hover:-translate-y-1'
            }`}
        >
          {usageExceeded ? 'Daily limit reached — add your own key to continue' : <>Generate &amp; Start Exam <ChevronRight className="w-5 h-5 ml-2" /></>}
        </button>
      </div>
    </div>
  );
}
