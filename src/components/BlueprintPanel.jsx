import { useState } from 'react';
import { BarChart2, ChevronUp, ChevronDown, ListChecks, Timer, BadgeCheck, GraduationCap, AlertCircle, FileText, CalendarCheck } from 'lucide-react';

const LEVEL_COLORS = {
  'Foundational-Level': 'bg-green-100 text-green-700',
  'Entry-Level':        'bg-blue-100 text-blue-700',
  'Intermediate-Level': 'bg-yellow-100 text-yellow-700',
  'Professional-Level': 'bg-orange-100 text-orange-700',
  'Expert-Level':       'bg-red-100 text-red-700',
};

const BAR_COLORS = [
  'bg-pink-500','bg-indigo-500','bg-blue-500','bg-teal-500',
  'bg-emerald-500','bg-orange-500','bg-purple-500','bg-cyan-500',
  'bg-rose-500','bg-amber-500','bg-lime-500','bg-sky-500',
];

export default function BlueprintPanel({ bp }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between p-5 bg-gradient-to-r from-slate-50 to-white hover:from-slate-100 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-pink-100 flex items-center justify-center flex-shrink-0">
            <BarChart2 className="w-5 h-5 text-pink-600" />
          </div>
          <div>
            <p className="font-bold text-slate-800 text-sm">Official Exam Blueprint</p>
            <p className="text-xs text-slate-500 mt-0.5">Questions · Time · Topic weights from Splunk's official PDF</p>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0 ml-4">
          <span className={`hidden sm:inline text-xs font-bold px-2.5 py-1 rounded-full ${LEVEL_COLORS[bp.level] || 'bg-slate-100 text-slate-600'}`}>{bp.level}</span>
          {open ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
        </div>
      </button>

      {open && (
        <div className="p-5 border-t border-slate-100 space-y-6 bg-white animate-fade-in">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="flex flex-col items-center bg-slate-50 rounded-xl p-3 border border-slate-100">
              <ListChecks className="w-5 h-5 text-pink-500 mb-1" />
              <span className="text-2xl font-extrabold text-slate-800">{bp.questions}</span>
              <span className="text-xs text-slate-500 font-medium mt-0.5">Questions</span>
            </div>
            <div className="flex flex-col items-center bg-slate-50 rounded-xl p-3 border border-slate-100">
              <Timer className="w-5 h-5 text-blue-500 mb-1" />
              <span className="text-2xl font-extrabold text-slate-800">{bp.minutes}</span>
              <span className="text-xs text-slate-500 font-medium mt-0.5">Minutes</span>
            </div>
            <div className="flex flex-col items-center bg-slate-50 rounded-xl p-3 border border-slate-100">
              <BadgeCheck className="w-5 h-5 text-green-500 mb-1" />
              <span className="text-2xl font-extrabold text-slate-800">{bp.passingScore}%</span>
              <span className="text-xs text-slate-500 font-medium mt-0.5">Passing Score</span>
            </div>
            <div className="flex flex-col items-center bg-slate-50 rounded-xl p-3 border border-slate-100">
              <GraduationCap className="w-5 h-5 text-purple-500 mb-1" />
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full mt-1 ${LEVEL_COLORS[bp.level] || 'bg-slate-100 text-slate-600'}`}>{bp.level}</span>
              <span className="text-xs text-slate-500 font-medium mt-1">Level</span>
            </div>
          </div>

          {bp.prerequisite && bp.prerequisite !== 'None' && (
            <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm">
              <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <span className="text-amber-800"><span className="font-bold">Prerequisite:</span> {bp.prerequisite}</span>
            </div>
          )}

          <div>
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Exam Content Breakdown</h4>
            <div className="space-y-2">
              {bp.topics.map((t, i) => (
                <div key={i} className="w-full">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-slate-600 font-medium leading-tight pr-2">{t.name}</span>
                    <span className="text-xs font-bold text-slate-700 flex-shrink-0">{t.pct}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${BAR_COLORS[i % BAR_COLORS.length]}`}
                      style={{ width: `${t.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-3 pt-2 border-t border-slate-100">
            <a href={bp.blueprintUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center text-xs font-semibold text-pink-600 hover:text-pink-800 bg-pink-50 border border-pink-200 px-3 py-2 rounded-lg transition-colors">
              <FileText className="w-3.5 h-3.5 mr-1.5" /> View Official Blueprint PDF
            </a>
            <a href={bp.scheduleUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 border border-blue-200 px-3 py-2 rounded-lg transition-colors">
              <CalendarCheck className="w-3.5 h-3.5 mr-1.5" /> Schedule via PearsonVUE
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
