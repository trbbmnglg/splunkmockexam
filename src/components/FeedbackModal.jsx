import { useState } from 'react';
import { ShieldCheck, X, AlertTriangle, CheckCircle, FileText, MessageSquare, Send } from 'lucide-react';
import { TOPICS } from '../utils/constants';
import { DEFAULT_GROQ_KEY, CF_WEBHOOK_URL, CF_WEBHOOK_TOKEN, validateSubmissionWithAI } from '../utils/api';

export default function FeedbackModal({ onClose, apiKey }) {
  const [feedbackState, setFeedbackState] = useState({ loading: false, success: false, error: null });
  const [feedbackForm, setFeedbackForm] = useState({ exam: '', status: 'pass', evidence: '', feedback: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFeedbackState({ loading: true, success: false, error: null });
    try {
      const effectiveKey = apiKey || DEFAULT_GROQ_KEY;
      const validation = await validateSubmissionWithAI(feedbackForm, effectiveKey);
      if (!validation.isValid) {
        setFeedbackState({ loading: false, success: false, error: `Validation Failed: ${validation.reason}` });
        return;
      }
      if (CF_WEBHOOK_URL) {
        const response = await fetch(CF_WEBHOOK_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(CF_WEBHOOK_TOKEN ? { 'Authorization': `Bearer ${CF_WEBHOOK_TOKEN}` } : {}),
          },
          body: JSON.stringify({
            targetEmail: 'web.rbbjr@gmail.com',
            exam: feedbackForm.exam,
            status: feedbackForm.status,
            evidence: feedbackForm.evidence,
            feedback: feedbackForm.feedback,
            validationConfidence: validation.confidenceScore,
            timestamp: new Date().toISOString(),
          }),
        });
        if (!response.ok) throw new Error('Failed to forward data to the webhook.');
      }
      setFeedbackState({ loading: false, success: true, error: null });
      setFeedbackForm({ exam: '', status: 'pass', evidence: '', feedback: '' });
      setTimeout(() => onClose(), 3000);
    } catch (err) {
      setFeedbackState({ loading: false, success: false, error: err.message || 'An unexpected error occurred.' });
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[70] flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white max-w-2xl w-full shadow-2xl animate-fade-in border border-slate-200 rounded-lg flex flex-col my-8">

        <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50 rounded-t-lg">
          <div>
            <h3 className="text-2xl font-bold text-slate-800 flex items-center">
              <ShieldCheck className="w-6 h-6 mr-2 text-green-600" /> Official Result Submission
            </h3>
            <p className="text-sm text-slate-500 mt-1">Submit your official exam result to help improve our AI's accuracy.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <X className="w-6 h-6 text-slate-500" />
          </button>
        </div>

        <div className="p-6 md:p-8 flex-grow">
          {feedbackState.success ? (
            <div className="text-center py-12 space-y-4">
              <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-10 h-10" />
              </div>
              <h4 className="text-2xl font-bold text-slate-800">Successfully Validated & Submitted!</h4>
              <p className="text-slate-600">Thank you for contributing. Your official feedback helps improve the practice materials.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {feedbackState.error && (
                <div className="bg-red-50 text-red-700 p-4 border border-red-200 rounded-md flex items-start">
                  <AlertTriangle className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5" />
                  <span className="text-sm font-medium">{feedbackState.error}</span>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Exam Taken</label>
                  <select
                    required
                    value={feedbackForm.exam}
                    onChange={(e) => setFeedbackForm({ ...feedbackForm, exam: e.target.value })}
                    className="w-full p-3 border border-slate-300 rounded focus:ring-2 focus:ring-pink-500 outline-none text-slate-700 bg-white"
                  >
                    <option value="" disabled>Select Certification...</option>
                    {Object.keys(TOPICS).map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Official Result</label>
                  <div className="flex bg-slate-100 p-1 rounded">
                    <button type="button" onClick={() => setFeedbackForm({ ...feedbackForm, status: 'pass' })} className={`flex-1 py-2 font-bold text-sm rounded transition-colors ${feedbackForm.status === 'pass' ? 'bg-green-500 text-white shadow' : 'text-slate-500 hover:text-slate-700'}`}>PASS</button>
                    <button type="button" onClick={() => setFeedbackForm({ ...feedbackForm, status: 'fail' })} className={`flex-1 py-2 font-bold text-sm rounded transition-colors ${feedbackForm.status === 'fail' ? 'bg-red-500 text-white shadow' : 'text-slate-500 hover:text-slate-700'}`}>FAIL</button>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center">
                  <FileText className="w-4 h-4 mr-1.5 text-slate-400" /> Paste Result Email / Evidence Text
                </label>
                <p className="text-xs text-slate-500 mb-2">Please paste the text confirming your score or status (redact personal info). Our AI will validate this to prevent spam.</p>
                <textarea
                  required
                  placeholder="Paste the text from PearsonVue or Splunk here..."
                  value={feedbackForm.evidence}
                  onChange={(e) => setFeedbackForm({ ...feedbackForm, evidence: e.target.value })}
                  className="w-full h-32 p-3 border border-slate-300 rounded focus:ring-2 focus:ring-pink-500 outline-none text-sm text-slate-700 font-mono resize-y"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center">
                  <MessageSquare className="w-4 h-4 mr-1.5 text-slate-400" /> Feedback on the Mock Exam Tool
                </label>
                <p className="text-xs text-slate-500 mb-2">Was the generated mock exam accurate compared to the real thing? What topics were missing?</p>
                <textarea
                  required
                  placeholder="Share your experience..."
                  value={feedbackForm.feedback}
                  onChange={(e) => setFeedbackForm({ ...feedbackForm, feedback: e.target.value })}
                  className="w-full h-24 p-3 border border-slate-300 rounded focus:ring-2 focus:ring-pink-500 outline-none text-sm text-slate-700 resize-y"
                />
              </div>
              <div className="bg-blue-50 p-4 rounded text-sm text-blue-800 flex items-start border border-blue-200">
                <ShieldCheck className="w-5 h-5 mr-2 flex-shrink-0 text-blue-500" />
                <p>Your submission will be processed and validated securely. Valid feedback is forwarded to the maintainer to enhance the AI generation prompts.</p>
              </div>
              <div className="pt-4 flex justify-end gap-4 border-t border-slate-100">
                <button type="button" onClick={onClose} className="px-6 py-3 font-semibold text-slate-600 hover:bg-slate-100 rounded transition-colors">Cancel</button>
                <button type="submit" disabled={feedbackState.loading} className="px-8 py-3 font-bold bg-pink-600 text-white rounded hover:bg-pink-700 transition-colors shadow-md flex items-center disabled:opacity-70">
                  {feedbackState.loading ? (
                    <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" /> Validating AI...</>
                  ) : (
                    <>Validate & Submit <Send className="w-4 h-4 ml-2" /></>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>

      </div>
    </div>
  );
}
