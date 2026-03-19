import { useState } from 'react';
import { Shield, ChevronUp, ChevronDown } from 'lucide-react';

const CONSENT_SECTIONS = [
  {
    title: '1. What This Tool Does',
    content: `This tool is a personal, AI-powered mock exam generator designed to help candidates prepare for Splunk certification exams. It dynamically generates practice questions based on official certification blueprints using third-party large language model (LLM) APIs. It does NOT access official Splunk exam question banks and is NOT affiliated with Splunk Inc. or PearsonVUE. Questions are generated fresh each session and are intended for study purposes only.`
  },
  {
    title: '2. Data Collected & Processed',
    content: `This tool collects and processes the following data:
• API Keys: Stored exclusively in your browser's localStorage. They are never transmitted to our servers.
• Exam Configurations: Topic selections, question counts, and timer settings are held in React state (memory only) and discarded when you close the tab.
• Consent Flag: A single boolean flag ("splunkExamConsent") is stored in localStorage to remember your consent decision.
• Adaptive Learning Profile: After each exam, your topic-level performance data (attempts, errors, score trends) is stored in both your browser's localStorage and in a Cloudflare D1 database. This data is linked to an anonymous random ID generated in your browser — it contains no personally identifiable information.
• Wrong Answer Bank: Missed questions are persisted to Cloudflare D1 for spaced repetition review. This data is linked to your anonymous ID only.
• Feedback Submissions: If you voluntarily submit an official exam result, the pasted evidence text, your chosen exam, and feedback are sent to a Cloudflare Worker webhook for processing. You should redact any personal information before pasting.`
  },
  {
    title: '3. AI Features & Third-Party Data Transmission',
    content: `When you generate an exam or submit feedback for validation, your configured prompt text and/or evidence text is sent directly from your browser to one of the following third-party AI providers, depending on your chosen generator engine:
• Groq (Meta Llama 3.3) — groq.com — Default engine
• Perplexity AI — perplexity.ai — Live web search engine
• Google Gemini — generativelanguage.googleapis.com
• OpenRouter / Alibaba Qwen — openrouter.ai

Your data is subject to the respective provider's privacy policy once transmitted. Do not paste sensitive, confidential, or personally identifiable information into any prompt field or evidence text box.`
  },
  {
    title: '4. GDPR — General Data Protection Regulation (EU)',
    content: `If you are located in the European Economic Area (EEA), you have rights under the General Data Protection Regulation (EU) 2016/679, including the right to access, rectify, or erase your personal data. The legal basis for processing data in this tool is your explicit consent (Art. 6(1)(a) GDPR), which you provide by checking all boxes on this screen.

Data minimization is applied: only the data strictly necessary for the service to function is processed. Third-party AI providers may act as data processors under GDPR. By using AI features, you acknowledge that your data may be transferred outside the EU/EEA to countries that may not offer the same level of data protection. You may withdraw consent at any time by clearing your browser's localStorage.`
  },
  {
    title: '5. PDPA — Data Privacy Act of 2012 (Philippines, RA 10173)',
    content: `If you are located in the Philippines, you are protected under Republic Act 10173, also known as the Data Privacy Act of 2012, administered by the National Privacy Commission (NPC). This tool processes your personal data based on your consent, as required under Section 12(a) of the DPA.

You have the right to be informed, to object, to access, to rectify, to erase or block, and to data portability. Cross-border data transfers occur when AI generation features are used, as data is transmitted to servers located outside the Philippines. These transfers are made in accordance with the adequacy standards of Section 21 of the DPA. For any privacy concerns, you may reach us at the contact details provided in the project repository.`
  },
  {
    title: '6. EU AI Act — Regulation (EU) 2024/1689',
    content: `This tool employs AI systems for question generation and submission validation. Based on the intended use and context, these systems are classified as minimal-risk or limited-risk AI under Annex III criteria of the EU AI Act (Regulation (EU) 2024/1689).

As a user, you retain full human oversight and control at all times. AI-generated questions are not presented as authoritative exam content — they are practice aids requiring your critical review. The tool does not make automated decisions with legal or significant personal effects. Transparency is maintained: you are always informed when AI is being used and which provider is involved.`
  },
  {
    title: '7. CCPA — California Consumer Privacy Act (US)',
    content: `If you are a California resident, you have rights under the California Consumer Privacy Act (CCPA), including the right to know what personal information is collected, the right to delete personal information, and the right to opt out of the sale of personal information.

This tool does not sell your personal information. API keys are stored locally in your browser only. If you submit official exam results via the feedback form, that submission data is forwarded to the tool's maintainer via a secure Cloudflare Worker for quality improvement purposes only. You may request deletion of any submitted data by contacting the maintainer through the project's repository.`
  },
];

export default function ConsentModal({ onConsent }) {
  const [consentChecks, setConsentChecks] = useState([false, false, false, false]);
  const [expandedSections, setExpandedSections] = useState({});

  const allChecked = consentChecks.every(Boolean);

  const toggleCheck = (idx) => {
    const next = [...consentChecks];
    next[idx] = !next[idx];
    setConsentChecks(next);
  };

  const toggleSection = (idx) => {
    setExpandedSections(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const handleDecline = () => {
    localStorage.removeItem('splunkExamConsent');
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = 'about:blank';
    }
  };

  const handleConsent = () => {
    if (!allChecked) return;
    localStorage.setItem('splunkExamConsent', 'true');
    onConsent();
  };

  return (
    <div className="fixed inset-0 bg-[#0f172a] z-[100] flex items-center justify-center p-4 md:p-8 overflow-y-auto">
      <div className="bg-[#1e293b] border border-[#334155] max-w-3xl w-full shadow-2xl animate-fade-in text-slate-300 rounded-xl overflow-hidden flex flex-col my-4" style={{ maxHeight: 'calc(100vh - 2rem)' }}>

        <div className="p-6 md:p-8 border-b border-[#334155] bg-[#0f172a]/50 flex items-center gap-4 flex-shrink-0">
          <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 flex-shrink-0">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Data & Privacy Consent</h2>
            <p className="text-sm text-slate-400 mt-1">Mock Exam Generator — Please read before proceeding</p>
          </div>
        </div>

        <div className="p-6 md:p-8 space-y-6 overflow-y-auto flex-grow">
          <p className="text-sm text-slate-300">Before using this tool, please read and acknowledge the following data processing and privacy disclosures. This is required under applicable privacy and AI regulations. Click each section to expand and read the full disclosure.</p>

          <div className="space-y-2">
            {CONSENT_SECTIONS.map((section, i) => (
              <div key={i} className="border border-[#334155] rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleSection(i)}
                  className="w-full flex items-center justify-between p-4 bg-[#0f172a]/50 hover:bg-[#0f172a]/80 transition-colors text-left"
                >
                  <span className="font-semibold text-white text-sm">{section.title}</span>
                  {expandedSections[i]
                    ? <ChevronUp className="w-5 h-5 text-blue-400 flex-shrink-0 ml-2" />
                    : <ChevronDown className="w-5 h-5 text-slate-400 flex-shrink-0 ml-2" />
                  }
                </button>
                {expandedSections[i] && (
                  <div className="p-4 bg-[#0f172a]/30 border-t border-[#334155]">
                    <p className="text-sm text-slate-400 leading-relaxed whitespace-pre-line">{section.content}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="pt-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Please confirm each item to proceed</h3>
            <div className="space-y-3">
              {[
                "I have read and understood how this tool stores and processes data, including that session data is locally stored and not transmitted to proprietary servers except where AI features are triggered.",
                "I understand that using AI features will transmit generation queries to a third-party AI provider (Groq/Meta/Google), and that sensitive data should not be pasted.",
                "I acknowledge the disclosures made under the Philippine Data Privacy Act (RA 10173), including cross-border data transfer when AI features are used.",
                "I understand this tool uses low-risk AI systems under the EU AI Act, that AI-generated content requires my review before use, and that I retain full human oversight.",
              ].map((text, idx) => (
                <label key={idx} className={`flex items-start p-4 border rounded-lg cursor-pointer transition-colors ${consentChecks[idx] ? 'bg-blue-900/20 border-blue-500/50' : 'bg-[#0f172a]/50 border-[#334155] hover:border-slate-500'}`}>
                  <div className="relative flex items-center justify-center w-6 h-6 border-2 rounded-full border-slate-500 mr-4 flex-shrink-0 mt-0.5 transition-colors">
                    <input type="checkbox" className="opacity-0 absolute inset-0 cursor-pointer" checked={consentChecks[idx]} onChange={() => toggleCheck(idx)} />
                    {consentChecks[idx] && <div className="w-3 h-3 bg-blue-500 rounded-full" />}
                  </div>
                  <span className={`text-sm leading-relaxed ${consentChecks[idx] ? 'text-slate-200' : 'text-slate-400'}`}>{text}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="p-6 md:p-8 bg-[#0f172a] border-t border-[#334155] flex flex-col sm:flex-row gap-4 flex-shrink-0">
          <button
            onClick={handleDecline}
            className="flex-1 py-4 font-semibold text-slate-400 bg-[#1e293b] rounded-lg hover:bg-slate-800 hover:text-slate-200 transition-colors border border-[#334155]"
          >
            Decline &amp; Exit
          </button>
          <button
            onClick={handleConsent}
            disabled={!allChecked}
            className={`flex-1 py-4 font-bold rounded-lg transition-all ${allChecked ? 'bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-900/20' : 'bg-slate-700 text-slate-500 cursor-not-allowed'}`}
          >
            Confirm all {consentChecks.filter(Boolean).length}/4 items above
          </button>
        </div>

      </div>
    </div>
  );
}
