import { useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  FileText,
  Link2,
  Loader2,
  RotateCcw,
  Sparkles,
  Upload,
} from 'lucide-react';
import type { DetectedJobMeta } from '../types/ats';

interface MatchInputViewProps {
  jobUrl: string;
  onJobUrlChange: (value: string) => void;
  jobDescription: string;
  onJobDescriptionChange: (value: string) => void;
  resumeText: string;
  onResumeTextChange: (value: string) => void;
  detectedMeta: DetectedJobMeta;
  missingCountEstimate: number;
  onLoadSample: () => void;
  onClearAll: () => void;
  onExtractUrl: () => Promise<void>;
  isExtractingUrl: boolean;
  onCleanFormatting: () => void;
  onFileUpload: (file: File) => Promise<void>;
  isParsingFile: boolean;
  onAnalyze: () => void;
  isAnalyzing: boolean;
}

function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

export function MatchInputView({
  jobUrl,
  onJobUrlChange,
  jobDescription,
  onJobDescriptionChange,
  resumeText,
  onResumeTextChange,
  detectedMeta,
  missingCountEstimate,
  onLoadSample,
  onClearAll,
  onExtractUrl,
  isExtractingUrl,
  onCleanFormatting,
  onFileUpload,
  isParsingFile,
  onAnalyze,
  isAnalyzing,
}: MatchInputViewProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const jdWords = countWords(jobDescription);
  const jdChars = jobDescription.length;
  const resumeWords = countWords(resumeText);
  const resumeChars = resumeText.length;

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    await onFileUpload(files[0]);
  };

  return (
    <div className="space-y-6">
      {/* Workspace Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            ATS Parsing Pre-Flight Check
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Compare your resume against any target job opening to detect keyword gaps, metric density, and Workday or Greenhouse parser blockers.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onLoadSample}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-slate-500" />
            <span>Load Sample</span>
          </button>
          <button
            type="button"
            onClick={onClearAll}
            className="px-3.5 py-2 text-xs font-semibold text-slate-600 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* Equal-Height Split Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">
        {/* Card 1: Target Job Opening */}
        <section className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900">01. Target Job Opening</h2>
              <span className="text-xs font-medium text-slate-500">Job Description</span>
            </div>

            {/* URL Import Bar */}
            <div>
              <label
                htmlFor="job-url-input"
                className="block text-xs font-semibold text-slate-700 mb-1.5"
              >
                Import from Job Posting URL
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Link2 className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="job-url-input"
                    type="url"
                    value={jobUrl}
                    onChange={(e) => onJobUrlChange(e.target.value)}
                    placeholder="https://boards.greenhouse.io/company/jobs/..."
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 placeholder-slate-400"
                  />
                </div>
                <button
                  type="button"
                  onClick={onExtractUrl}
                  disabled={isExtractingUrl}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-60 border border-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 cursor-pointer"
                >
                  {isExtractingUrl ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Extracting...</span>
                    </>
                  ) : (
                    <span>Extract</span>
                  )}
                </button>
              </div>
            </div>

            {/* Unboxed Metadata Line */}
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-600 pt-1">
              <span className="font-semibold text-slate-900">{detectedMeta.title}</span>
              <span aria-hidden="true" className="text-slate-300">
                ·
              </span>
              <span>{detectedMeta.company}</span>
              <span aria-hidden="true" className="text-slate-300">
                ·
              </span>
              <span>{detectedMeta.employmentType}</span>
            </div>

            {/* Job Description Textarea */}
            <div>
              <label htmlFor="job-desc-area" className="sr-only">
                Job Description Text
              </label>
              <textarea
                id="job-desc-area"
                rows={12}
                value={jobDescription}
                onChange={(e) => onJobDescriptionChange(e.target.value)}
                placeholder="Paste the full job description including qualifications, responsibilities, and core technical stack..."
                className="w-full p-3.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono leading-relaxed text-slate-800 resize-y"
              />
              <div className="flex items-center justify-between text-xs text-slate-500 mt-2">
                <span className="font-mono tabular-nums">
                  {jdWords} words · {jdChars} chars
                </span>
                <span className="text-emerald-700 font-medium inline-flex items-center gap-1 tabular-nums">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{detectedMeta.keywordCount} target keywords detected</span>
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Card 2: Current Resume */}
        <section className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900">02. Your Current Resume</h2>
              <span className="text-xs font-medium text-slate-500">Plain Text or File</span>
            </div>

            {/* Interactive File Dropzone */}
            <div
              role="button"
              tabIndex={0}
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={async (e) => {
                e.preventDefault();
                setIsDragging(false);
                await handleFiles(e.dataTransfer.files);
              }}
              className={`border-2 border-dashed rounded-lg p-3.5 transition-colors cursor-pointer flex items-center justify-between gap-3 ${
                isDragging
                  ? 'border-indigo-500 bg-indigo-50/40'
                  : 'border-slate-200 hover:border-indigo-400 bg-slate-50/70 hover:bg-slate-50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.txt,.md"
                className="hidden"
                onChange={(e) => handleFiles(e.target.files)}
              />
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-600 shrink-0">
                  {isParsingFile ? (
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-800">
                    {isParsingFile ? 'Extracting text from file...' : 'Upload resume file or drop here'}
                  </p>
                  <p className="text-xs text-slate-500">Supports PDF, DOCX, TXT, or Markdown</p>
                </div>
              </div>
              <span className="text-xs font-semibold text-indigo-600 whitespace-nowrap shrink-0">
                Browse
              </span>
            </div>

            {/* Parser Utility Bar */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs font-medium text-slate-600">
                Plain-text parser ready
              </span>
              <button
                type="button"
                onClick={onCleanFormatting}
                className="px-2.5 py-1 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-md transition-colors whitespace-nowrap shrink-0 inline-flex items-center gap-1 cursor-pointer"
              >
                <Sparkles className="w-3 h-3" />
                <span>Clean Formatting</span>
              </button>
            </div>

            {/* Resume Textarea */}
            <div>
              <label htmlFor="resume-content-area" className="sr-only">
                Resume Text
              </label>
              <textarea
                id="resume-content-area"
                rows={12}
                value={resumeText}
                onChange={(e) => onResumeTextChange(e.target.value)}
                placeholder="Paste your current resume text here..."
                className="w-full p-3.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono leading-relaxed text-slate-800 resize-y"
              />
              <div className="flex items-center justify-between text-xs text-slate-500 mt-2">
                <span className="font-mono tabular-nums">
                  {resumeWords} words · {resumeChars} chars
                </span>
                {missingCountEstimate > 0 ? (
                  <span className="text-amber-700 font-medium inline-flex items-center gap-1 tabular-nums">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>{missingCountEstimate} keyword gaps detected</span>
                  </span>
                ) : (
                  <span className="text-emerald-700 font-medium inline-flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Strong keyword coverage</span>
                  </span>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Primary Action Footer */}
      <div className="pt-1">
        <button
          type="button"
          onClick={onAnalyze}
          disabled={isAnalyzing || !jobDescription.trim() || !resumeText.trim()}
          className="w-full py-3.5 px-6 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-sm rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Running ATS Diagnostic &amp; Keyword Match...</span>
            </>
          ) : (
            <>
              <span>Run ATS Match &amp; Score Prediction</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
        <p className="text-center text-xs text-slate-500 mt-2">
          Evaluates keyword parity, linear formatting safety, quantified impact, and seniority alignment
        </p>
      </div>
    </div>
  );
}
