import { Settings, X, ChevronRight, ListChecks, Clock, BookOpen, Cpu, Key, Lock, CheckCircle, ShieldCheck, Globe, Zap, RotateCcw, ExternalLink } from 'lucide-react';
import { TOPICS, EXAM_BLUEPRINTS, API_KEY_URLS, PRODUCT_CONTEXT_MAP, CURRENT_YEAR, YEAR_RANGE } from '../utils/constants';
import { DEFAULT_GROQ_KEY } from '../utils/api';
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
}) {
  const toggleTopic = (topic) => {
    setExamConfig(prev => {
      const selected = prev.selectedTopics.includes(topic)
        ? prev.selectedTopics.filter(t => t !== topic)
        : [...prev.selectedTopics, topic];
      return { ...prev, selectedTopics: selected };
    });
  };

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
              <input
                type="checkbox"
                className="sr-only"
                checked={examConfig.useTimer}
                onChange={(e) => setExamConfig(prev => ({ ...prev, useTimer: e.target.checked }))}
              />
              <div className={`block w-14 h-8 transition-colors rounded-full ${examConfig.useTimer ? 'bg-slate-800' : 'bg-slate-300'}`} />
              <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${examConfig.useTimer ? 'transform translate-x-6' : ''}`} />
            </div>
            <div className="ml-4">
              <div className="font-bold text-slate-800">{examConfig.useTimer ? 'Timer Enabled' : 'Untimed Practice'}</div>
              <div className="text-sm text-slate-500">{examConfig.useTimer ? 'A strict countdown timer will run based on question count.' : 'Take your time without any pressure.'}</div>
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
          <p className="text-sm text-slate-500 mb-4">If no topics are selected, the exam will cover all topics randomly.</p>
          <div className="grid sm:grid-cols-2 gap-3 max-h-64 overflow-y-auto p-1 pr-2">
            {TOPICS[examType].map((topic, idx) => {
              const isSelected = examConfig.selectedTopics.includes(topic);
              return (
                <div
                  key={idx}
                  onClick={() => toggleTopic(topic)}
                  className={`p-3 border rounded cursor-pointer transition-all flex items-start space-x-3 ${isSelected ? 'bg-pink-50 border-pink-400' : 'bg-white border-slate-200 hover:border-pink-300'}`}
                >
                  <div className={`mt-0.5 flex-shrink-0 w-5 h-5 border rounded flex items-center justify-center transition-colors ${isSelected ? 'bg-pink-500 border-pink-500' : 'border-slate-300'}`}>
                    {isSelected && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                  </div>
                  <span className={`text-sm font-medium ${isSelected ? 'text-pink-900' : 'text-slate-700'}`}>{topic}</span>
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
              {/* Provider selector */}
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

                {/* API key input */}
                <div className="relative animate-fade-in">
                  <div className="flex justify-between items-end mb-2">
                    <label className="block text-sm font-semibold text-slate-700 flex items-center">
                      <Key className="w-4 h-4 mr-1.5" /> {examConfig.aiProvider.toUpperCase()} API Key
                    </label>
                    <a href={API_KEY_URLS[examConfig.aiProvider]} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center">
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
                    <p className="text-xs text-green-700 mt-2 flex items-center font-medium bg-green-50 p-2 border border-green-200 rounded">
                      <CheckCircle className="w-4 h-4 mr-1.5 flex-shrink-0" /> A shared Groq key is pre-configured. You can start the exam immediately, or paste your own key for higher rate limits and quality validation.
                    </p>
                  ) : (
                    <p className="text-xs text-green-700 mt-2 flex items-center font-medium bg-green-50 p-2 border border-green-200 rounded">
                      <ShieldCheck className="w-4 h-4 mr-1.5 flex-shrink-0" /> Security Note: Your key is stored securely in your browser's local storage and is never sent to our servers.
                    </p>
                  )}
                </div>

                {examConfig.aiProvider === 'perplexity' && (
                  <div className="bg-purple-50 text-purple-800 p-3 mt-3 text-sm flex items-start border border-purple-200 rounded">
                    <Globe className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
                    <p>Perplexity AI explicitly searches the live web to combine the latest {YEAR_RANGE} official Splunk documentation to ensure maximum accuracy.</p>
                  </div>
                )}
              </div>

              {/* Prompt editor */}
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
                <p className="text-xs text-slate-500 mb-3">
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
        <button onClick={onStart} className="flex-1 flex items-center justify-center px-6 py-4 font-bold bg-pink-600 text-white hover:bg-pink-700 rounded transition-transform hover:-translate-y-1 shadow-lg">
          Generate & Start Exam <ChevronRight className="w-5 h-5 ml-2" />
        </button>
      </div>
    </div>
  );
}
