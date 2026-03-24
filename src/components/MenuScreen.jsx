/**
 * components/MenuScreen.jsx
 *
 * The main certification selection screen.
 * Extracted from App.jsx's renderMenu() function.
 *
 * Props:
 *   viewMode          — 'grid' | 'list'
 *   setViewMode       — setter
 *   communityStats    — { [certId]: { topics: [{ topic, errorRate }] } }
 *   onSelectExamType  — called with certId when a card is clicked
 *   onShowFeedback    — opens the FeedbackModal
 */

import { memo } from 'react';
import { Award, Settings, LayoutGrid, List, Users, Flame } from 'lucide-react';
import { CERT_CARDS } from '../utils/constants';

export default memo(function MenuScreen({
  viewMode,
  setViewMode,
  communityStats,
  onSelectExamType,
  onShowFeedback,
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[75vh] px-4 space-y-8 animate-fade-in py-12">

      <div className="text-center space-y-4">
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-800 tracking-tight">
          Splunk <span className="text-pink-600">Mock Exam</span> Tool
        </h1>
        <p className="text-slate-600 max-w-lg mx-auto text-lg">
          Test your readiness with dynamically generated questions tailored to the official certification blueprints.
        </p>
      </div>

      {/* ── Toolbar ── */}
      <div className="w-full max-w-6xl flex justify-between items-center mb-[-1rem]">
        <button
          onClick={onShowFeedback}
          className="flex items-center text-sm font-bold text-indigo-600 hover:text-indigo-800 transition-colors bg-indigo-50 hover:bg-indigo-100 px-4 py-2 rounded-full shadow-sm border border-indigo-200"
        >
          <Award className="w-4 h-4 mr-2" /> Submit Official Exam Result
        </button>

        <div className="bg-slate-200/70 p-1 flex space-x-1 shadow-inner rounded">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 transition-all rounded-sm ${viewMode === 'grid' ? 'bg-white shadow text-pink-600' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200'}`}
            title="Grid View"
          >
            <LayoutGrid className="w-5 h-5" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 transition-all rounded-sm ${viewMode === 'list' ? 'bg-white shadow text-pink-600' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200'}`}
            title="List View"
          >
            <List className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* ── Cert cards ── */}
      <div className={`w-full max-w-6xl ${viewMode === 'grid' ? 'grid md:grid-cols-2 lg:grid-cols-3 gap-6' : 'flex flex-col space-y-4'}`}>
        {CERT_CARDS.map((cert) => {
          const Icon          = cert.icon;
          const stats         = communityStats[cert.id];
          const hardestTopics = stats?.topics?.slice(0, 3) || [];

          return (
            <div
              key={cert.id}
              onClick={() => onSelectExamType(cert.id)}
              className={`bg-white p-6 shadow-md border-t-4 ${cert.theme.border} hover:shadow-xl transition-all cursor-pointer group transform hover:-translate-y-1 rounded-b-lg
                ${viewMode === 'grid' ? 'flex flex-col' : 'flex flex-col md:flex-row md:items-center gap-4 md:gap-8'}`}
            >
              {/* Title + icon */}
              <div className={`flex items-center justify-between ${viewMode === 'grid' ? 'mb-4' : 'md:w-1/3 min-w-[250px]'}`}>
                <h2 className={`text-xl font-bold text-slate-800 ${cert.theme.hoverText} transition-colors leading-tight`}>
                  {cert.title}
                </h2>
                <Icon className={`${cert.theme.text} w-8 h-8 flex-shrink-0 ml-3 ${viewMode === 'list' && 'hidden md:block'}`} />
              </div>

              {/* Description */}
              <p className={`text-slate-500 text-sm ${viewMode === 'grid' ? 'mb-4 flex-grow' : 'flex-grow md:mb-0'}`}>
                {cert.desc}
              </p>

              {/* Community heatmap */}
              <div className={`${viewMode === 'grid' ? 'mb-4' : 'md:mb-0 md:w-48 flex-shrink-0'}`}>
                <div className="flex items-center gap-1.5 mb-2">
                  <Users className="w-3 h-3 text-slate-400" />
                  <span className="text-xs text-slate-400 font-medium uppercase tracking-wide">Community finds hardest</span>
                </div>
                {hardestTopics.length > 0 ? (
                  <div className="space-y-1">
                    {hardestTopics.map((t, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <Flame className={`w-3 h-3 flex-shrink-0 ${t.errorRate >= 60 ? 'text-red-500' : t.errorRate >= 40 ? 'text-orange-400' : 'text-yellow-400'}`} />
                        <span className="text-xs text-slate-600 truncate">{t.topic}</span>
                        <span className={`text-xs font-bold ml-auto flex-shrink-0 ${t.errorRate >= 60 ? 'text-red-500' : t.errorRate >= 40 ? 'text-orange-500' : 'text-yellow-600'}`}>
                          {t.errorRate}%
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">Accumulates after more sessions</p>
                )}
              </div>

              {/* CTA button */}
              <button className={`${cert.theme.bg} ${cert.theme.text} font-semibold py-2.5 px-6 rounded ${cert.theme.hoverBg} group-hover:text-white transition-colors flex items-center justify-center
                ${viewMode === 'grid' ? 'w-full mt-auto' : 'w-full md:w-auto md:flex-shrink-0 whitespace-nowrap'}`}>
                Configure Exam <Settings className="ml-2 w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
});
