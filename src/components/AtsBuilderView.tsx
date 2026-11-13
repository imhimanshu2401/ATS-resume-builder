import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Code2,
  Copy,
  Download,
  FileCode2,
  FileDown,
  FileText,
  Loader2,
  Plus,
  RefreshCw,
  RotateCcw,
  Sparkles,
  Trash2,
} from 'lucide-react';
import {
  parseLatexToPreview,
  validateLatexSyntax,
  type LatexInlineSpan,
} from '../lib/latexEngine';
import type {
  AtsAnalysisReport,
  BuilderEditorMode,
  FontScale,
  ResumeData,
  TemplateStyle,
} from '../types/ats';

interface AtsBuilderViewProps {
  resume: ResumeData;
  onChangeResume: (next: ResumeData) => void;
  latexSource: string;
  onChangeLatexSource: (nextLatex: string) => void;
  editorMode: BuilderEditorMode;
  onChangeEditorMode: (mode: BuilderEditorMode) => void;
  onSyncFormFromLatex: () => void;
  onResetLatexFromForm: () => void;
  liveReport: AtsAnalysisReport;
  missingKeywords: string[];
  originalSummary: string | null;
  onRevertSummary: () => void;
  onInsertKeyword: (keyword: string) => void;
  onRewriteSummary: () => Promise<void>;
  onRewriteBullets: (roleIndex: number) => Promise<void>;
  onAutoOptimize: () => Promise<void>;
  loadingAction: string | null;
  onCopyLatex: () => Promise<void>;
  onDownloadTex: () => void;
  onDownloadTxt: () => void;
  onExportPdf: () => void;
}

type SectionKey = 'contact' | 'summary' | 'skills' | 'experience' | 'education';

function renderInlineSpans(spans: LatexInlineSpan[]) {
  return spans.map((span, idx) => {
    let content: React.ReactNode = span.text;
    if (span.bold) content = <strong>{content}</strong>;
    if (span.italic) content = <em>{content}</em>;
    if (span.underline) content = <span className="underline underline-offset-2">{content}</span>;
    if (span.href) {
      return (
        <a
          key={idx}
          href={span.href}
          target="_blank"
          rel="noreferrer"
          className="text-slate-900 hover:text-indigo-700"
        >
          {content}
        </a>
      );
    }
    return <span key={idx}>{content}</span>;
  });
}

export function AtsBuilderView({
  resume,
  onChangeResume,
  latexSource,
  onChangeLatexSource,
  editorMode,
  onChangeEditorMode,
  onSyncFormFromLatex,
  onResetLatexFromForm,
  liveReport,
  missingKeywords,
  originalSummary,
  onRevertSummary,
  onInsertKeyword,
  onRewriteSummary,
  onRewriteBullets,
  onAutoOptimize,
  loadingAction,
  onCopyLatex,
  onDownloadTex,
  onDownloadTxt,
  onExportPdf,
}: AtsBuilderViewProps) {
  const [mobileTab, setMobileTab] = useState<'editor' | 'preview'>('editor');
  const [templateStyle, setTemplateStyle] = useState<TemplateStyle>('jake-latex');
  const [fontScale, setFontScale] = useState<FontScale>('standard');
  const [openSections, setOpenSections] = useState<Record<SectionKey, boolean>>({
    contact: true,
    summary: true,
    skills: true,
    experience: true,
    education: true,
  });

  const toggleSection = (key: SectionKey) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const latexPreview = useMemo(() => parseLatexToPreview(latexSource), [latexSource]);
  const latexValidation = useMemo(() => validateLatexSyntax(latexSource), [latexSource]);
  const latexLineCount = useMemo(() => latexSource.split('\n').length, [latexSource]);

  const skillsText = resume.skills.join(', ');
  const normalizedAllLower = latexSource.toLowerCase();

  const remainingKeywords = missingKeywords.filter(
    (kw) => !normalizedAllLower.includes(kw.toLowerCase()),
  );

  const updateExperience = (
    index: number,
    patch: Partial<ResumeData['experiences'][number]>,
  ) => {
    const nextExp = resume.experiences.map((item, idx) =>
      idx === index ? { ...item, ...patch } : item,
    );
    onChangeResume({ ...resume, experiences: nextExp });
  };

  const addExperience = () => {
    const nextExp = [
      ...resume.experiences,
      {
        id: `exp-${Date.now()}`,
        title: 'Product Analyst',
        company: 'Company Name',
        location: resume.location || 'Remote',
        dates: '2020 – 2022',
        bullets: ['Delivered measurable analytics and reporting improvements.'],
      },
    ];
    onChangeResume({ ...resume, experiences: nextExp });
  };

  const removeExperience = (index: number) => {
    if (resume.experiences.length <= 1) return;
    onChangeResume({
      ...resume,
      experiences: resume.experiences.filter((_, idx) => idx !== index),
    });
  };

  const insertLatexSnippet = (snippetType: 'item' | 'role' | 'section') => {
    const snippets: Record<typeof snippetType, string> = {
      item: `\n        \\resumeItem{Delivered measurable project outcomes improving throughput by 18\\%.}`,
      role: `\n    \\resumeSubheading\n      {Role Title}{2022 -- Present}\n      {Company Name}{City, State}\n      \\resumeItemListStart\n        \\resumeItem{Built cross-functional analytics pipelines and dashboards.}\n      \\resumeItemListEnd`,
      section: `\n%-----------PROJECTS-----------\n\\section{Projects}\n  \\resumeSubHeadingListStart\n    \\resumeProjectHeading\n      {\\textbf{Project Name} $|$ \\emph{Python, SQL}}{2024}\n      \\resumeItemListStart\n        \\resumeItem{Implemented automated workflow reducing manual effort by 40\\%.}\n      \\resumeItemListEnd\n  \\resumeSubHeadingListEnd`,
    };

    const endDocIdx = latexSource.lastIndexOf('\\end{document}');
    if (endDocIdx >= 0) {
      const before = latexSource.slice(0, endDocIdx).trimEnd();
      const after = latexSource.slice(endDocIdx);
      onChangeLatexSource(`${before}\n${snippets[snippetType]}\n\n${after}`);
    } else {
      onChangeLatexSource(`${latexSource}\n${snippets[snippetType]}`);
    }
  };

  const fontSizeStyle =
    fontScale === 'compact'
      ? { fontSize: '0.88rem' }
      : fontScale === 'large'
        ? { fontSize: '1.03rem' }
        : { fontSize: '0.95rem' };

  return (
    <div className="space-y-5">
      {/* Workspace Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-slate-200 rounded-xl px-4 py-3">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
          <span className="font-bold text-slate-900">LaTeX Single-Column ATS Canvas</span>
          <span aria-hidden="true" className="text-slate-300">
            ·
          </span>
          <span className="text-slate-600">
            Live Match Score:{' '}
            <strong className="font-mono tabular-nums text-indigo-700">
              {liveReport.overallScore}/100
            </strong>
          </span>
          <span aria-hidden="true" className="text-slate-300 hidden sm:inline">
            ·
          </span>
          <span className="text-emerald-700 font-medium hidden sm:inline tabular-nums">
            {liveReport.categories.formattingSafety}% parser safe
          </span>
        </div>

        {/* Mobile View Switcher */}
        <div className="flex items-center p-1 bg-slate-100 rounded-lg text-xs font-semibold lg:hidden self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setMobileTab('editor')}
            className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
              mobileTab === 'editor'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Editor
          </button>
          <button
            type="button"
            onClick={() => setMobileTab('preview')}
            className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
              mobileTab === 'preview'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            PDF Preview
          </button>
        </div>
      </div>

      {/* 12-Column Split Editor & Live A4 Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* LEFT PANEL: Dual Structured Form + Raw LaTeX Code Editor */}
        <div
          className={`lg:col-span-5 space-y-4 ${
            mobileTab === 'preview' ? 'hidden lg:block' : 'block'
          }`}
        >
          {/* Editor Mode Switcher */}
          <div className="bg-white border border-slate-200 rounded-xl p-2 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-lg flex-1">
              <button
                type="button"
                onClick={() => onChangeEditorMode('form')}
                className={`flex-1 py-1.5 px-3 rounded-md text-xs font-semibold transition-colors inline-flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  editorMode === 'form'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Structured Form</span>
              </button>
              <button
                type="button"
                onClick={() => onChangeEditorMode('latex')}
                className={`flex-1 py-1.5 px-3 rounded-md text-xs font-semibold transition-colors inline-flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  editorMode === 'latex'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Code2 className="w-3.5 h-3.5" />
                <span>LaTeX Source (.tex)</span>
              </button>
            </div>
          </div>

          {/* JD-Tailored Summary & Auto-Optimize Bar */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-xs font-bold text-slate-900">
                  JD-Tailored Summary &amp; Optimization
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Summary and skills are tailored to the target job description. Edit freely below or regenerate anytime.
                </p>
              </div>
              {originalSummary && originalSummary !== resume.summary && (
                <button
                  type="button"
                  onClick={onRevertSummary}
                  className="text-xs font-semibold text-slate-600 hover:text-slate-900 inline-flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Revert</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={onRewriteSummary}
                disabled={loadingAction !== null}
                className="py-2 px-3 bg-indigo-50 hover:bg-indigo-100 disabled:opacity-60 text-indigo-700 border border-indigo-200 rounded-lg font-semibold text-xs inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                {loadingAction === 'summary' ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="w-3.5 h-3.5" />
                )}
                <span>Regenerate Summary</span>
              </button>

              <button
                type="button"
                onClick={onAutoOptimize}
                disabled={loadingAction !== null}
                className="py-2 px-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-lg font-semibold text-xs inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                {loadingAction === 'auto-optimize' ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
                <span>Auto-Optimize All</span>
              </button>
            </div>
          </div>

          {/* Quick-Insert Missing Keywords */}
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-bold text-slate-800">
                Quick-Insert Missing JD Keywords
              </span>
              <span className="text-xs text-slate-500 font-mono tabular-nums">
                {remainingKeywords.length} remaining
              </span>
            </div>

            {missingKeywords.length === 0 ? (
              <p className="text-xs text-emerald-700 font-medium flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5" />
                <span>All target keywords are already included.</span>
              </p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {missingKeywords.map((kw) => {
                  const isAdded = normalizedAllLower.includes(kw.toLowerCase());
                  return (
                    <button
                      key={kw}
                      type="button"
                      disabled={isAdded}
                      onClick={() => onInsertKeyword(kw)}
                      className={`text-xs font-semibold px-2.5 py-1 rounded-md border transition-colors inline-flex items-center gap-1 whitespace-nowrap ${
                        isAdded
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 cursor-default'
                          : 'bg-rose-50 hover:bg-indigo-50 text-rose-800 hover:text-indigo-700 border-rose-200 hover:border-indigo-300 cursor-pointer'
                      }`}
                    >
                      {isAdded ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                      <span>{kw}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {editorMode === 'form' ? (
            /* STRUCTURED FORM EDITOR */
            <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100 overflow-hidden">
              {/* 1. Contact Header */}
              <div className="p-4">
                <button
                  type="button"
                  onClick={() => toggleSection('contact')}
                  className="w-full flex items-center justify-between text-left cursor-pointer"
                >
                  <span className="text-xs font-bold text-slate-900">01. Contact Header</span>
                  {openSections.contact ? (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  )}
                </button>
                {openSections.contact && (
                  <div className="mt-3 space-y-2.5 text-xs">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={resume.name}
                        onChange={(e) => onChangeResume({ ...resume, name: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:bg-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                          Email
                        </label>
                        <input
                          type="email"
                          value={resume.email}
                          onChange={(e) => onChangeResume({ ...resume, email: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                          Phone
                        </label>
                        <input
                          type="text"
                          value={resume.phone}
                          onChange={(e) => onChangeResume({ ...resume, phone: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                          Location
                        </label>
                        <input
                          type="text"
                          value={resume.location}
                          onChange={(e) => onChangeResume({ ...resume, location: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                          LinkedIn / Portfolio
                        </label>
                        <input
                          type="text"
                          value={resume.linkedin}
                          onChange={(e) => onChangeResume({ ...resume, linkedin: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 2. Professional Summary */}
              <div className="p-4">
                <button
                  type="button"
                  onClick={() => toggleSection('summary')}
                  className="w-full flex items-center justify-between text-left cursor-pointer"
                >
                  <span className="text-xs font-bold text-slate-900">
                    02. Professional Summary (JD-Tailored)
                  </span>
                  {openSections.summary ? (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  )}
                </button>
                {openSections.summary && (
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500">Target 35–55 words</span>
                      <button
                        type="button"
                        onClick={onRewriteSummary}
                        disabled={loadingAction !== null}
                        className="px-2.5 py-1 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-md transition-colors inline-flex items-center gap-1 cursor-pointer"
                      >
                        {loadingAction === 'summary' ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Sparkles className="w-3 h-3" />
                        )}
                        <span>Tailor to JD</span>
                      </button>
                    </div>
                    <textarea
                      rows={4}
                      value={resume.summary}
                      onChange={(e) => onChangeResume({ ...resume, summary: e.target.value })}
                      className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:border-indigo-500 text-slate-800 leading-relaxed resize-y"
                    />
                  </div>
                )}
              </div>

              {/* 3. Core Skills */}
              <div className="p-4">
                <button
                  type="button"
                  onClick={() => toggleSection('skills')}
                  className="w-full flex items-center justify-between text-left cursor-pointer"
                >
                  <span className="text-xs font-bold text-slate-900">
                    03. Technical Skills (JD-Aligned)
                  </span>
                  {openSections.skills ? (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  )}
                </button>
                {openSections.skills && (
                  <div className="mt-3 space-y-2">
                    <p className="text-xs text-slate-500">
                      Comma-separated skills serialized cleanly into the LaTeX Technical Skills block.
                    </p>
                    <textarea
                      rows={3}
                      value={skillsText}
                      onChange={(e) =>
                        onChangeResume({
                          ...resume,
                          skills: e.target.value
                            .split(',')
                            .map((s) => s.trim())
                            .filter(Boolean),
                        })
                      }
                      className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:border-indigo-500 text-slate-800 font-mono leading-relaxed resize-y"
                    />
                  </div>
                )}
              </div>

              {/* 4. Work Experience */}
              <div className="p-4">
                <button
                  type="button"
                  onClick={() => toggleSection('experience')}
                  className="w-full flex items-center justify-between text-left cursor-pointer"
                >
                  <span className="text-xs font-bold text-slate-900">
                    04. Professional Experience
                  </span>
                  {openSections.experience ? (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  )}
                </button>
                {openSections.experience && (
                  <div className="mt-3 space-y-4">
                    {resume.experiences.map((exp, idx) => (
                      <div
                        key={exp.id}
                        className="pt-3 first:pt-0 border-t first:border-t-0 border-slate-100 space-y-2.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-slate-700 tabular-nums">
                            Role {idx + 1}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => onRewriteBullets(idx)}
                              disabled={loadingAction !== null}
                              className="px-2.5 py-1 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-md transition-colors inline-flex items-center gap-1 cursor-pointer"
                            >
                              {loadingAction === `bullet-${idx}` ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Sparkles className="w-3 h-3" />
                              )}
                              <span>Rewrite with Metrics</span>
                            </button>
                            {resume.experiences.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeExperience(idx)}
                                aria-label={`Remove role ${idx + 1}`}
                                className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={exp.title}
                            onChange={(e) => updateExperience(idx, { title: e.target.value })}
                            placeholder="Job Title"
                            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:bg-white focus:outline-none focus:border-indigo-500"
                          />
                          <input
                            type="text"
                            value={exp.company}
                            onChange={(e) => updateExperience(idx, { company: e.target.value })}
                            placeholder="Company"
                            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:border-indigo-500"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={exp.location}
                            onChange={(e) => updateExperience(idx, { location: e.target.value })}
                            placeholder="Location"
                            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:border-indigo-500"
                          />
                          <input
                            type="text"
                            value={exp.dates}
                            onChange={(e) => updateExperience(idx, { dates: e.target.value })}
                            placeholder="2021 – Present"
                            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono tabular-nums focus:bg-white focus:outline-none focus:border-indigo-500"
                          />
                        </div>

                        <textarea
                          rows={4}
                          value={exp.bullets.join('\n')}
                          onChange={(e) =>
                            updateExperience(idx, {
                              bullets: e.target.value
                                .split('\n')
                                .map((line) => line.replace(/^[•\-*]\s*/, '')),
                            })
                          }
                          placeholder="One achievement bullet per line..."
                          className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:border-indigo-500 text-slate-800 leading-relaxed resize-y"
                        />
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={addExperience}
                      className="w-full py-2 px-3 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors inline-flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Experience Role</span>
                    </button>
                  </div>
                )}
              </div>

              {/* 5. Education & Certifications */}
              <div className="p-4">
                <button
                  type="button"
                  onClick={() => toggleSection('education')}
                  className="w-full flex items-center justify-between text-left cursor-pointer"
                >
                  <span className="text-xs font-bold text-slate-900">
                    05. Education &amp; Certifications
                  </span>
                  {openSections.education ? (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  )}
                </button>
                {openSections.education && (
                  <div className="mt-3 space-y-2.5 text-xs">
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={resume.education.degree}
                        onChange={(e) =>
                          onChangeResume({
                            ...resume,
                            education: { ...resume.education, degree: e.target.value },
                          })
                        }
                        placeholder="Degree"
                        className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:bg-white focus:outline-none focus:border-indigo-500"
                      />
                      <input
                        type="text"
                        value={resume.education.school}
                        onChange={(e) =>
                          onChangeResume({
                            ...resume,
                            education: { ...resume.education, school: e.target.value },
                          })
                        }
                        placeholder="University"
                        className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={resume.education.year}
                        onChange={(e) =>
                          onChangeResume({
                            ...resume,
                            education: { ...resume.education, year: e.target.value },
                          })
                        }
                        placeholder="Graduation Year"
                        className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono tabular-nums focus:bg-white focus:outline-none focus:border-indigo-500"
                      />
                      <input
                        type="text"
                        value={resume.education.certifications}
                        onChange={(e) =>
                          onChangeResume({
                            ...resume,
                            education: { ...resume.education, certifications: e.target.value },
                          })
                        }
                        placeholder="Certifications"
                        className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* RAW LATEX SOURCE CODE EDITOR */
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              {/* Code Toolbar */}
              <div className="px-4 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 bg-slate-50">
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-bold text-slate-800 font-mono">resume.tex</span>
                  <span aria-hidden="true" className="text-slate-300">
                    ·
                  </span>
                  {latexValidation.valid ? (
                    <span className="text-emerald-700 font-medium inline-flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Valid LaTeX</span>
                    </span>
                  ) : (
                    <span className="text-amber-700 font-medium inline-flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>{latexValidation.issue}</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={onCopyLatex}
                    className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-md inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Copy className="w-3 h-3" />
                    <span>Copy</span>
                  </button>
                  <button
                    type="button"
                    onClick={onSyncFormFromLatex}
                    className="px-2.5 py-1 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-md cursor-pointer"
                  >
                    Sync Form
                  </button>
                  <button
                    type="button"
                    onClick={onResetLatexFromForm}
                    className="px-2.5 py-1 text-xs font-semibold text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 rounded-md cursor-pointer"
                  >
                    Reset
                  </button>
                </div>
              </div>

              {/* Quick LaTeX Macro Inserters */}
              <div className="px-4 py-2 border-b border-slate-100 flex flex-wrap items-center gap-1.5 bg-white">
                <span className="text-xs text-slate-500 mr-1">Insert macro:</span>
                <button
                  type="button"
                  onClick={() => insertLatexSnippet('item')}
                  className="px-2 py-0.5 text-xs font-mono text-slate-700 bg-slate-100 hover:bg-slate-200 rounded cursor-pointer"
                >
                  +\resumeItem
                </button>
                <button
                  type="button"
                  onClick={() => insertLatexSnippet('role')}
                  className="px-2 py-0.5 text-xs font-mono text-slate-700 bg-slate-100 hover:bg-slate-200 rounded cursor-pointer"
                >
                  +\resumeSubheading
                </button>
                <button
                  type="button"
                  onClick={() => insertLatexSnippet('section')}
                  className="px-2 py-0.5 text-xs font-mono text-slate-700 bg-slate-100 hover:bg-slate-200 rounded cursor-pointer"
                >
                  +\section
                </button>
              </div>

              {/* Code Textarea */}
              <div className="p-3 bg-slate-950">
                <label htmlFor="latex-code-editor" className="sr-only">
                  Raw LaTeX Resume Code
                </label>
                <textarea
                  id="latex-code-editor"
                  rows={28}
                  spellCheck={false}
                  value={latexSource}
                  onChange={(e) => onChangeLatexSource(e.target.value)}
                  className="w-full bg-slate-950 text-slate-100 font-mono text-xs leading-relaxed focus:outline-none resize-y selection:bg-indigo-500/40"
                />
              </div>

              <div className="px-4 py-2 bg-slate-900 text-slate-400 text-xs font-mono tabular-nums flex items-center justify-between border-t border-slate-800">
                <span>{latexLineCount} lines · Overleaf / pdfLaTeX compatible</span>
                <span>Live preview synced</span>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT PANEL: Live LaTeX-Rendered A4 Sheet & Export */}
        <div
          className={`lg:col-span-7 space-y-3 ${
            mobileTab === 'editor' ? 'hidden lg:block' : 'block'
          }`}
        >
          {/* Paper Control Toolbar */}
          <div className="bg-white border border-slate-200 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setTemplateStyle('jake-latex')}
                  className={`px-2.5 py-1 rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                    templateStyle === 'jake-latex'
                      ? 'bg-white text-indigo-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Jake LaTeX
                </button>
                <button
                  type="button"
                  onClick={() => setTemplateStyle('modern-sans')}
                  className={`px-2.5 py-1 rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                    templateStyle === 'modern-sans'
                      ? 'bg-white text-indigo-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Modern Sans
                </button>
              </div>

              <label className="flex items-center gap-1.5 text-xs text-slate-600">
                <span>Scale:</span>
                <select
                  value={fontScale}
                  onChange={(e) => setFontScale(e.target.value as FontScale)}
                  className="bg-slate-100 border border-slate-200 rounded-md py-1 px-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                >
                  <option value="compact">Compact (10pt)</option>
                  <option value="standard">Standard (11pt)</option>
                  <option value="large">Relaxed (12pt)</option>
                </select>
              </label>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={onDownloadTex}
                className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg inline-flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer"
              >
                <FileCode2 className="w-3.5 h-3.5 text-slate-600" />
                <span>Download .tex</span>
              </button>
              <button
                type="button"
                onClick={onDownloadTxt}
                className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg inline-flex items-center gap-1 transition-colors whitespace-nowrap cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>.txt</span>
              </button>
              <button
                type="button"
                onClick={onExportPdf}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg inline-flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer"
              >
                <FileDown className="w-3.5 h-3.5" />
                <span>Export to PDF</span>
              </button>
            </div>
          </div>

          {/* A4 Document Canvas Rendered Directly from LaTeX AST */}
          <div className="bg-slate-200/70 p-4 sm:p-6 rounded-xl flex justify-center overflow-x-auto">
            <article
              id="resume-sheet"
              style={fontSizeStyle}
              className={`ats-sheet bg-white w-full max-w-[660px] min-h-[850px] px-8 py-8 sm:px-10 sm:py-9 text-slate-950 ${
                templateStyle === 'jake-latex' ? 'font-serif' : 'font-sans'
              }`}
            >
              {/* LaTeX Header Block */}
              <header className="text-center pb-2.5">
                <h1
                  style={
                    templateStyle === 'jake-latex'
                      ? { fontVariant: 'small-caps' }
                      : undefined
                  }
                  className="text-2xl sm:text-[1.75rem] font-bold tracking-tight text-slate-950 leading-tight"
                >
                  {latexPreview.name}
                </h1>
                <p className="text-[11.5px] text-slate-800 mt-1 leading-snug">
                  {renderInlineSpans(latexPreview.contactItems)}
                </p>
              </header>

              {/* Dynamic LaTeX Sections */}
              <div className="space-y-3">
                {latexPreview.sections.map((section, sIdx) => (
                  <section key={`${section.title}-${sIdx}`}>
                    <h2
                      style={
                        templateStyle === 'jake-latex'
                          ? { fontVariant: 'small-caps' }
                          : undefined
                      }
                      className="text-[13px] sm:text-sm font-bold tracking-wide text-slate-950 border-b border-slate-900 pb-0.5 mb-1.5"
                    >
                      {section.title}
                    </h2>

                    <div className="space-y-2">
                      {section.blocks.map((block, bIdx) => {
                        if (block.kind === 'paragraph') {
                          return (
                            <p
                              key={bIdx}
                              className="text-[11.5px] leading-relaxed text-slate-800"
                            >
                              {renderInlineSpans(block.spans)}
                            </p>
                          );
                        }

                        if (block.kind === 'list') {
                          return (
                            <ul key={bIdx} className="space-y-0.5 pl-3 text-[11.5px] leading-relaxed text-slate-800">
                              {block.items.map((itemSpans, iIdx) => (
                                <li key={iIdx}>{renderInlineSpans(itemSpans)}</li>
                              ))}
                            </ul>
                          );
                        }

                        return (
                          <div key={bIdx} className="pl-2">
                            <div className="flex justify-between items-baseline gap-3 text-[12px]">
                              <span className="font-bold text-slate-950">{block.title}</span>
                              <span className="text-[11.5px] text-slate-800 tabular-nums shrink-0">
                                {block.dates}
                              </span>
                            </div>
                            {(block.subtitle || block.location) && (
                              <div className="flex justify-between items-baseline gap-3 text-[11.5px] text-slate-800 italic">
                                <span>{block.subtitle}</span>
                                <span className="shrink-0">{block.location}</span>
                              </div>
                            )}
                            {block.items.length > 0 && (
                              <ul className="list-disc list-outside pl-4 mt-1 space-y-0.5 text-[11.5px] text-slate-800 leading-snug">
                                {block.items.map((itemSpans, iIdx) => (
                                  <li key={iIdx}>{renderInlineSpans(itemSpans)}</li>
                                ))}
                              </ul>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </section>
                ))}
              </div>
            </article>
          </div>

          {/* Live Compliance Summary */}
          <div className="px-4 py-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-800">
              Jake&apos;s Resume LaTeX Structure · 100% ATS Parseable
            </span>
            <span className="text-slate-500">Single-column PDF &amp; Overleaf .tex ready</span>
          </div>
        </div>
      </div>
    </div>
  );
}
