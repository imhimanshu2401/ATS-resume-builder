import { useMemo, useState } from 'react';
import mammoth from 'mammoth';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { TopHeader } from './components/TopHeader';
import { MatchInputView } from './components/MatchInputView';
import { ScoreDiagnosticView } from './components/ScoreDiagnosticView';
import { AtsBuilderView } from './components/AtsBuilderView';
import {
  analyzeHeuristic,
  detectJobMetadata,
  serializeResumeToText,
} from './lib/atsEngine';
import {
  extractResumeDataFromLatex,
  generateJakeLatex,
  latexToPlainText,
} from './lib/latexEngine';
import {
  DEFAULT_BUILDER_RESUME,
  SAMPLE_JOB_DESCRIPTION,
  SAMPLE_JOB_URL,
  SAMPLE_RESUME_TEXT,
} from './lib/sampleData';
import type {
  ActionPlanItem,
  ActiveView,
  AtsAnalysisReport,
  BuilderEditorMode,
  ResumeData,
} from './types/ats';

interface ToastState {
  message: string;
  variant: 'success' | 'error' | 'info';
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || '');
      const commaIdx = result.indexOf(',');
      resolve(commaIdx >= 0 ? result.slice(commaIdx + 1) : result);
    };
    reader.onerror = () => reject(new Error('Failed to read file.'));
    reader.readAsDataURL(file);
  });
}

export default function App() {
  const [activeView, setActiveView] = useState<ActiveView>('input');
  const [jobUrl, setJobUrl] = useState<string>('');
  const [jobDescription, setJobDescription] = useState<string>(SAMPLE_JOB_DESCRIPTION);
  const [resumeText, setResumeText] = useState<string>(SAMPLE_RESUME_TEXT);

  const [builderResume, setBuilderResume] = useState<ResumeData>(DEFAULT_BUILDER_RESUME);
  const [latexSource, setLatexSource] = useState<string>(() =>
    generateJakeLatex(DEFAULT_BUILDER_RESUME),
  );
  const [editorMode, setEditorMode] = useState<BuilderEditorMode>('form');
  const [originalSummary, setOriginalSummary] = useState<string | null>(
    DEFAULT_BUILDER_RESUME.summary,
  );
  const [hasBuilderEdits, setHasBuilderEdits] = useState<boolean>(false);

  const [analysisReport, setAnalysisReport] = useState<AtsAnalysisReport>(() =>
    analyzeHeuristic(SAMPLE_JOB_DESCRIPTION, SAMPLE_RESUME_TEXT, false),
  );

  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [isExtractingUrl, setIsExtractingUrl] = useState<boolean>(false);
  const [isParsingFile, setIsParsingFile] = useState<boolean>(false);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = (message: string, variant: ToastState['variant'] = 'info') => {
    setToast({ message, variant });
    window.setTimeout(() => {
      setToast((current) => (current?.message === message ? null : current));
    }, 4000);
  };

  // Live metadata & gap preview while editing Match Input
  const liveInputPreview = useMemo(
    () => analyzeHeuristic(jobDescription, resumeText, false),
    [jobDescription, resumeText],
  );

  const detectedMeta = useMemo(
    () => detectJobMetadata(jobDescription),
    [jobDescription],
  );

  // Live score in Builder recalculated from current LaTeX document text
  const liveBuilderReport = useMemo(() => {
    if (!hasBuilderEdits) {
      return analysisReport;
    }
    const plainFromLatex = latexToPlainText(latexSource);
    return analyzeHeuristic(jobDescription, plainFromLatex, false);
  }, [hasBuilderEdits, analysisReport, latexSource, jobDescription]);

  // Track which missing keywords from the current diagnostic are now present in builder
  const addedKeywords = useMemo(() => {
    const combined = latexSource.toLowerCase();
    const set = new Set<string>();
    for (const item of analysisReport.missingKeywords) {
      if (combined.includes(item.keyword.toLowerCase())) {
        set.add(item.keyword.toLowerCase());
      }
    }
    return set;
  }, [analysisReport.missingKeywords, latexSource]);

  const applyResumeAndLatex = (nextResume: ResumeData, markEdited = true) => {
    setBuilderResume(nextResume);
    setLatexSource(generateJakeLatex(nextResume));
    if (markEdited) setHasBuilderEdits(true);
  };

  const applyAnalysisToBuilder = (report: AtsAnalysisReport) => {
    const base = report.parsedResume || builderResume;
    setOriginalSummary(base.summary);

    const tailoredResume: ResumeData = {
      ...base,
      summary: report.tailoredSummary || base.summary,
      skills:
        report.tailoredSkills && report.tailoredSkills.length > 0
          ? report.tailoredSkills
          : base.skills,
    };

    setBuilderResume(tailoredResume);
    setLatexSource(generateJakeLatex(tailoredResume));
    setHasBuilderEdits(Boolean(report.tailoredSummary));
  };

  const handleLoadSample = () => {
    setJobUrl(SAMPLE_JOB_URL);
    setJobDescription(SAMPLE_JOB_DESCRIPTION);
    setResumeText(SAMPLE_RESUME_TEXT);
    setOriginalSummary(DEFAULT_BUILDER_RESUME.summary);
    applyResumeAndLatex(DEFAULT_BUILDER_RESUME, false);
    setAnalysisReport(analyzeHeuristic(SAMPLE_JOB_DESCRIPTION, SAMPLE_RESUME_TEXT, false));
    showToast('Loaded Stripe Product Analyst JD & sample resume.', 'success');
  };

  const handleClearAll = () => {
    setJobUrl('');
    setJobDescription('');
    setResumeText('');
    showToast('Cleared job description and resume inputs.', 'info');
  };

  const handleExtractUrl = async () => {
    if (!jobUrl.trim()) {
      showToast('Paste a Greenhouse, Lever, or company careers URL first.', 'error');
      return;
    }

    setIsExtractingUrl(true);
    try {
      const response = await fetch('/api/ats/extract-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: jobUrl.trim() }),
      });
      const data = (await response.json()) as { jobDescription?: string; error?: string };

      if (!response.ok || !data.jobDescription) {
        showToast(data.error || 'Could not extract job posting from URL.', 'error');
        return;
      }

      setJobDescription(data.jobDescription);
      showToast('Extracted job description from posting URL.', 'success');
    } catch {
      showToast('Network error while fetching job posting URL.', 'error');
    } finally {
      setIsExtractingUrl(false);
    }
  };

  const handleCleanFormatting = () => {
    const cleaned = resumeText
      .replace(/[•▪➢►★]/g, '-')
      .replace(/\t+/g, ' ')
      .replace(/ {3,}/g, ' ')
      .trim();
    setResumeText(cleaned);
    showToast('Standardized bullet characters and whitespace for ATS parsing.', 'success');
  };

  const handleFileUpload = async (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    setIsParsingFile(true);
    try {
      if (ext === 'txt' || ext === 'md') {
        const text = await file.text();
        setResumeText(text.trim());
        showToast(`Imported ${file.name}.`, 'success');
      } else if (ext === 'docx') {
        const buffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer: buffer });
        if (!result.value.trim()) {
          showToast('No readable text found in this DOCX file.', 'error');
          return;
        }
        setResumeText(result.value.trim());
        showToast(`Extracted plain text from ${file.name}.`, 'success');
      } else if (ext === 'pdf') {
        const base64Data = await fileToBase64(file);
        const response = await fetch('/api/ats/parse-file', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: file.name,
            mimeType: 'application/pdf',
            base64Data,
          }),
        });
        const data = (await response.json()) as { text?: string; error?: string };
        if (!response.ok || !data.text) {
          showToast(data.error || 'Unable to parse PDF file.', 'error');
          return;
        }
        setResumeText(data.text);
        showToast(`Parsed resume text from ${file.name}.`, 'success');
      } else {
        showToast('Unsupported file type. Upload PDF, DOCX, TXT, or MD.', 'error');
      }
    } catch {
      showToast('Failed to read uploaded file.', 'error');
    } finally {
      setIsParsingFile(false);
    }
  };

  const handleAnalyze = async () => {
    if (!jobDescription.trim() || !resumeText.trim()) {
      showToast('Enter both a job description and resume text before analyzing.', 'error');
      setActiveView('input');
      return;
    }

    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/ats/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobDescription, resumeText }),
      });

      const data = (await response.json()) as AtsAnalysisReport & { error?: string };
      if (!response.ok) {
        throw new Error(data.error || 'Analysis failed');
      }

      setAnalysisReport(data);
      applyAnalysisToBuilder(data);
      setActiveView('report');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      showToast('Generated ATS diagnostic & JD-tailored LaTeX draft.', 'success');
    } catch {
      const fallback = analyzeHeuristic(jobDescription, resumeText, true);
      setAnalysisReport(fallback);
      applyAnalysisToBuilder(fallback);
      setActiveView('report');
      showToast('Completed local ATS analysis & JD-tailored LaTeX draft.', 'info');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleChangeLatexSource = (nextLatex: string) => {
    setLatexSource(nextLatex);
    setHasBuilderEdits(true);
  };

  const handleSyncFormFromLatex = () => {
    const synced = extractResumeDataFromLatex(latexSource, builderResume);
    setBuilderResume(synced);
    showToast('Synced structured form fields from LaTeX code.', 'success');
  };

  const handleResetLatexFromForm = () => {
    setLatexSource(generateJakeLatex(builderResume));
    showToast('Regenerated LaTeX code from structured form.', 'info');
  };

  const handleChangeEditorMode = (nextMode: BuilderEditorMode) => {
    if (nextMode === 'form' && editorMode === 'latex') {
      const synced = extractResumeDataFromLatex(latexSource, builderResume);
      setBuilderResume(synced);
    }
    setEditorMode(nextMode);
  };

  const handleRevertSummary = () => {
    if (!originalSummary) return;
    applyResumeAndLatex({ ...builderResume, summary: originalSummary });
    showToast('Reverted Professional Summary to original text.', 'info');
  };

  const handleInsertKeyword = (keyword: string) => {
    const syncedBase =
      editorMode === 'latex'
        ? extractResumeDataFromLatex(latexSource, builderResume)
        : builderResume;

    const exists = syncedBase.skills.some(
      (s) => s.toLowerCase() === keyword.toLowerCase(),
    );
    if (!exists) {
      applyResumeAndLatex({
        ...syncedBase,
        skills: [...syncedBase.skills, keyword],
      });
      showToast(`Added "${keyword}" to Technical Skills in LaTeX.`, 'success');
    }
  };

  const handleQueueKeywordFromReport = (keyword: string) => {
    handleInsertKeyword(keyword);
    setActiveView('builder');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleApplyActionPlan = (item: ActionPlanItem) => {
    if (item.keywordsToAdd && item.keywordsToAdd.length > 0) {
      const nextSkills = [...builderResume.skills];
      for (const kw of item.keywordsToAdd) {
        if (!nextSkills.some((s) => s.toLowerCase() === kw.toLowerCase())) {
          nextSkills.push(kw);
        }
      }
      applyResumeAndLatex({ ...builderResume, skills: nextSkills });
      showToast(`Inserted ${item.keywordsToAdd.join(', ')} into LaTeX Skills.`, 'success');
    } else if (item.beforeText && item.afterText) {
      const idx = item.targetRoleIndex ?? 0;
      const targetExp = builderResume.experiences[idx];
      if (targetExp) {
        const replaced = targetExp.bullets.map((b) =>
          b.toLowerCase().includes(item.beforeText!.slice(0, 24).toLowerCase())
            ? item.afterText!
            : b,
        );
        const didReplace = replaced.some((b, i) => b !== targetExp.bullets[i]);
        const nextBullets = didReplace ? replaced : [item.afterText, ...targetExp.bullets];
        const nextExperiences = builderResume.experiences.map((exp, eIdx) =>
          eIdx === idx ? { ...exp, bullets: nextBullets } : exp,
        );
        applyResumeAndLatex({ ...builderResume, experiences: nextExperiences });
        showToast('Applied quantified bullet upgrade in LaTeX Builder.', 'success');
      }
    } else {
      handleCleanFormatting();
      setLatexSource(generateJakeLatex(builderResume));
      setHasBuilderEdits(true);
      showToast('Standardized single-column Jake LaTeX layout.', 'success');
    }

    setActiveView('builder');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRewriteSummary = async () => {
    const activeResume =
      editorMode === 'latex'
        ? extractResumeDataFromLatex(latexSource, builderResume)
        : builderResume;

    setLoadingAction('summary');
    try {
      const response = await fetch('/api/ats/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'summary',
          jobDescription,
          resumeData: activeResume,
          missingKeywords: analysisReport.missingKeywords.map((m) => m.keyword),
        }),
      });
      const data = (await response.json()) as { summary?: string; error?: string };
      if (!response.ok || !data.summary) {
        showToast(data.error || 'Could not enhance summary.', 'error');
        return;
      }
      applyResumeAndLatex({ ...activeResume, summary: data.summary });
      showToast('Rewrote Professional Summary for target JD.', 'success');
    } catch {
      showToast('Failed to reach rewrite service.', 'error');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleRewriteBullets = async (roleIndex: number) => {
    const activeResume =
      editorMode === 'latex'
        ? extractResumeDataFromLatex(latexSource, builderResume)
        : builderResume;

    setLoadingAction(`bullet-${roleIndex}`);
    try {
      const response = await fetch('/api/ats/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'bullet',
          jobDescription,
          resumeData: activeResume,
          targetExperienceIndex: roleIndex,
          missingKeywords: analysisReport.missingKeywords.map((m) => m.keyword),
        }),
      });
      const data = (await response.json()) as { bullets?: string[]; error?: string };
      if (!response.ok || !data.bullets) {
        showToast(data.error || 'Could not rewrite bullets.', 'error');
        return;
      }
      const nextExperiences = activeResume.experiences.map((exp, idx) =>
        idx === roleIndex ? { ...exp, bullets: data.bullets! } : exp,
      );
      applyResumeAndLatex({ ...activeResume, experiences: nextExperiences });
      showToast(`Strengthened Role ${roleIndex + 1} bullets in LaTeX.`, 'success');
    } catch {
      showToast('Failed to reach rewrite service.', 'error');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleAutoOptimize = async () => {
    const activeResume =
      editorMode === 'latex'
        ? extractResumeDataFromLatex(latexSource, builderResume)
        : builderResume;

    setLoadingAction('auto-optimize');
    try {
      const response = await fetch('/api/ats/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'auto-optimize',
          jobDescription,
          resumeData: activeResume,
          missingKeywords: analysisReport.missingKeywords.map((m) => m.keyword),
        }),
      });
      const data = (await response.json()) as {
        summary?: string;
        skills?: string[];
        firstRoleBullets?: string[];
        error?: string;
      };
      if (!response.ok) {
        showToast(data.error || 'Auto-optimize failed.', 'error');
        return;
      }
      const nextExperiences = activeResume.experiences.map((exp, idx) =>
        idx === 0 && data.firstRoleBullets?.length
          ? { ...exp, bullets: data.firstRoleBullets }
          : exp,
      );
      applyResumeAndLatex({
        ...activeResume,
        summary: data.summary || activeResume.summary,
        skills: data.skills?.length ? data.skills : activeResume.skills,
        experiences: nextExperiences,
      });
      showToast('LaTeX resume auto-optimized for the target JD.', 'success');
    } catch {
      showToast('Failed to auto-optimize resume.', 'error');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleCopyLatex = async () => {
    try {
      await navigator.clipboard.writeText(latexSource);
      showToast('Copied LaTeX source code to clipboard.', 'success');
    } catch {
      showToast('Clipboard permission denied. Use Download .tex instead.', 'error');
    }
  };

  const handleDownloadTex = () => {
    const blob = new Blob([latexSource], { type: 'application/x-tex;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const safeName = (builderResume.name || 'Candidate')
      .trim()
      .replace(/[^a-zA-Z0-9]+/g, '_');
    const a = document.createElement('a');
    a.href = url;
    a.download = `${safeName}_Resume.tex`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Downloaded Overleaf-ready LaTeX file (.tex).', 'success');
  };

  const handleDownloadTxt = () => {
    const current =
      editorMode === 'latex'
        ? extractResumeDataFromLatex(latexSource, builderResume)
        : builderResume;
    const txt = serializeResumeToText(current);
    const blob = new Blob([txt], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const safeName = (current.name || 'Candidate')
      .trim()
      .replace(/[^a-zA-Z0-9]+/g, '_');
    const a = document.createElement('a');
    a.href = url;
    a.download = `${safeName}_ATS_Resume.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Downloaded plain-text ATS resume (.txt).', 'success');
  };

  const handleExportPdf = () => {
    showToast('Opening print dialog — choose "Save as PDF" to export.', 'info');
    window.setTimeout(() => {
      window.print();
    }, 200);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <TopHeader
        activeView={activeView}
        onSwitchView={(view) => {
          setActiveView(view);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onAnalyze={handleAnalyze}
        isAnalyzing={isAnalyzing}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {activeView === 'input' && (
          <MatchInputView
            jobUrl={jobUrl}
            onJobUrlChange={setJobUrl}
            jobDescription={jobDescription}
            onJobDescriptionChange={setJobDescription}
            resumeText={resumeText}
            onResumeTextChange={setResumeText}
            detectedMeta={detectedMeta}
            missingCountEstimate={liveInputPreview.missingKeywords.length}
            onLoadSample={handleLoadSample}
            onClearAll={handleClearAll}
            onExtractUrl={handleExtractUrl}
            isExtractingUrl={isExtractingUrl}
            onCleanFormatting={handleCleanFormatting}
            onFileUpload={handleFileUpload}
            isParsingFile={isParsingFile}
            onAnalyze={handleAnalyze}
            isAnalyzing={isAnalyzing}
          />
        )}

        {activeView === 'report' && (
          <ScoreDiagnosticView
            report={analysisReport}
            addedKeywords={addedKeywords}
            onQueueKeyword={handleQueueKeywordFromReport}
            onApplyActionPlan={handleApplyActionPlan}
            onOpenBuilder={() => {
              setActiveView('builder');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {activeView === 'builder' && (
          <AtsBuilderView
            resume={builderResume}
            onChangeResume={(next) => applyResumeAndLatex(next, true)}
            latexSource={latexSource}
            onChangeLatexSource={handleChangeLatexSource}
            editorMode={editorMode}
            onChangeEditorMode={handleChangeEditorMode}
            onSyncFormFromLatex={handleSyncFormFromLatex}
            onResetLatexFromForm={handleResetLatexFromForm}
            liveReport={liveBuilderReport}
            missingKeywords={analysisReport.missingKeywords.map((m) => m.keyword)}
            originalSummary={originalSummary}
            onRevertSummary={handleRevertSummary}
            onInsertKeyword={handleInsertKeyword}
            onRewriteSummary={handleRewriteSummary}
            onRewriteBullets={handleRewriteBullets}
            onAutoOptimize={handleAutoOptimize}
            loadingAction={loadingAction}
            onCopyLatex={handleCopyLatex}
            onDownloadTex={handleDownloadTex}
            onDownloadTxt={handleDownloadTxt}
            onExportPdf={handleExportPdf}
          />
        )}
      </main>

      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-5 right-5 z-50 max-w-sm bg-slate-900 text-white text-xs px-4 py-3 rounded-xl shadow-lg border border-slate-700 flex items-center gap-2.5"
        >
          {toast.variant === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : toast.variant === 'error' ? (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          ) : (
            <Info className="w-4 h-4 text-indigo-400 shrink-0" />
          )}
          <span className="leading-snug">{toast.message}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            aria-label="Dismiss notification"
            className="text-slate-400 hover:text-white ml-1 shrink-0 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
