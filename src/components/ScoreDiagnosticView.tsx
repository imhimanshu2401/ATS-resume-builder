import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  Plus,
  Wrench,
} from 'lucide-react';
import type { ActionPlanItem, AtsAnalysisReport } from '../types/ats';

interface ScoreDiagnosticViewProps {
  report: AtsAnalysisReport;
  addedKeywords: Set<string>;
  onQueueKeyword: (keyword: string) => void;
  onApplyActionPlan: (item: ActionPlanItem) => void;
  onOpenBuilder: () => void;
}

export function ScoreDiagnosticView({
  report,
  addedKeywords,
  onQueueKeyword,
  onApplyActionPlan,
  onOpenBuilder,
}: ScoreDiagnosticViewProps) {
  const circumference = 264;
  const clampedScore = Math.min(100, Math.max(0, report.overallScore));
  const strokeDashoffset = circumference - (clampedScore / 100) * circumference;

  const scoreRingColor =
    clampedScore >= 80
      ? 'text-emerald-600'
      : clampedScore >= 65
        ? 'text-indigo-600'
        : 'text-amber-600';

  const tierStyle =
    clampedScore >= 80
      ? 'text-emerald-700'
      : clampedScore >= 65
        ? 'text-indigo-700'
        : 'text-amber-700';

  const categoryRows = [
    {
      label: 'Keyword & Skill Match',
      value: report.categories.keywordMatch,
      barClass: 'bg-indigo-600',
      textClass: 'text-indigo-700',
    },
    {
      label: 'Formatting & Parser Safety',
      value: report.categories.formattingSafety,
      barClass: 'bg-emerald-600',
      textClass: 'text-emerald-700',
    },
    {
      label: 'Quantified Impact & Metrics',
      value: report.categories.quantifiedImpact,
      barClass: report.categories.quantifiedImpact >= 75 ? 'bg-emerald-600' : 'bg-amber-600',
      textClass: report.categories.quantifiedImpact >= 75 ? 'text-emerald-700' : 'text-amber-700',
    },
    {
      label: 'Role & Seniority Alignment',
      value: report.categories.roleAlignment,
      barClass: 'bg-indigo-500',
      textClass: 'text-indigo-700',
    },
  ];

  const remainingMissing = report.missingKeywords.filter(
    (m) => !addedKeywords.has(m.keyword.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      {/* Context Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Score Diagnostic Report
          </h1>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500 mt-1">
            <span className="font-semibold text-slate-700">{report.detectedJobMeta.title}</span>
            <span aria-hidden="true">·</span>
            <span>{report.detectedJobMeta.company}</span>
            <span aria-hidden="true">·</span>
            <span>
              {report.source === 'gemini' ? 'AI Semantic + Keyword Evaluation' : 'Deterministic ATS Evaluation'}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={onOpenBuilder}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 self-start sm:self-auto cursor-pointer"
        >
          <span>Open ATS Builder</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Top 3-Column Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
        {/* Card 1: Overall Score Gauge */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col items-center text-center justify-between">
          <div className="w-full flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">Overall ATS Score</span>
            <span className={`text-xs font-bold ${tierStyle}`}>{report.tierLabel}</span>
          </div>

          <div className="relative w-32 h-32 my-3 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100" aria-hidden="true">
              <circle
                cx="50"
                cy="50"
                r="42"
                stroke="currentColor"
                strokeWidth="8"
                className="text-slate-100"
                fill="transparent"
              />
              <circle
                cx="50"
                cy="50"
                r="42"
                stroke="currentColor"
                strokeWidth="8"
                className={`${scoreRingColor} transition-all duration-700 ease-out`}
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-3xl font-extrabold text-slate-900 tracking-tight font-mono tabular-nums">
                {clampedScore}
                <span className="text-sm text-slate-400 font-normal">/100</span>
              </span>
              <span className="text-xs font-semibold text-emerald-700 tabular-nums">
                {report.percentile}th percentile
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">{report.summaryInsight}</p>
        </div>

        {/* Card 2: Category Breakdown */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-700">Category Breakdown</span>
            <span className="text-xs text-slate-500 font-mono tabular-nums">4 vectors</span>
          </div>

          <div className="space-y-3">
            {categoryRows.map((row) => (
              <div key={row.label}>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-700">{row.label}</span>
                  <span className={`font-mono tabular-nums ${row.textClass}`}>{row.value}%</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${row.barClass}`}
                    style={{ width: `${row.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="pt-3 mt-3 text-xs text-slate-500 border-t border-slate-100 flex items-center justify-between">
            <span>Parser Compliance</span>
            <span className="text-emerald-700 font-semibold tabular-nums">
              {report.formattingChecks.filter((c) => c.status === 'pass').length}/
              {report.formattingChecks.length} checks passed
            </span>
          </div>
        </div>

        {/* Card 3: Optimization Potential */}
        <div className="bg-slate-900 text-white border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold text-indigo-300">Optimization Potential</span>
            <h2 className="text-lg font-bold text-white mt-1.5 tabular-nums">
              Boost Score to {report.projectedScore}/100
            </h2>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              {remainingMissing.length > 0
                ? `We identified ${remainingMissing.length} missing target keywords (${remainingMissing
                    .slice(0, 3)
                    .map((k) => k.keyword)
                    .join(', ')}) ready to insert into your ATS-safe resume.`
                : 'All detected target keywords are integrated. Fine-tune your metric phrasing and export your single-column PDF.'}
            </p>
          </div>

          <div className="mt-5">
            <button
              type="button"
              onClick={onOpenBuilder}
              className="w-full py-2.5 px-4 bg-white text-slate-900 hover:bg-slate-100 font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>Fix Issues in ATS Builder</span>
            </button>
            <p className="text-center text-xs text-slate-400 mt-2">
              Single-column ATS formatting applied automatically
            </p>
          </div>
        </div>
      </div>

      {/* Middle Row: Keyword Gap Analysis */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-stretch">
        {/* Matched Keywords */}
        <section className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-slate-900 tabular-nums">
              Matched Keywords ({report.matchedKeywords.length})
            </h3>
            <span className="text-xs font-semibold text-emerald-700 tabular-nums">
              {report.categories.keywordMatch}% coverage
            </span>
          </div>
          <p className="text-xs text-slate-500 mb-4">
            Terms verified in both the target job description and your current resume.
          </p>

          {report.matchedKeywords.length === 0 ? (
            <p className="text-xs text-slate-500 py-4">
              No exact keyword matches found yet. Use the ATS Builder to align your skills and bullets.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {report.matchedKeywords.map((kw) => (
                <span
                  key={kw}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 text-xs font-medium border border-emerald-200"
                >
                  <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                  <span>{kw}</span>
                </span>
              ))}
            </div>
          )}
        </section>

        {/* Missing Keywords */}
        <section className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-slate-900 tabular-nums">
              Missing Critical Keywords ({report.missingKeywords.length})
            </h3>
            <span className="text-xs font-semibold text-rose-700">
              {remainingMissing.length > 0 ? `${remainingMissing.length} unadded` : 'All queued'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mb-4">
            Select any missing term to insert it directly into your ATS Builder skills inventory.
          </p>

          {report.missingKeywords.length === 0 ? (
            <div className="flex items-center gap-2 text-xs text-emerald-700 font-medium py-3">
              <CheckCircle2 className="w-4 h-4" />
              <span>Zero critical keyword gaps remaining.</span>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {report.missingKeywords.map((item) => {
                const isAdded = addedKeywords.has(item.keyword.toLowerCase());
                return (
                  <button
                    key={item.keyword}
                    type="button"
                    disabled={isAdded}
                    onClick={() => onQueueKeyword(item.keyword)}
                    title={item.context}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border transition-colors whitespace-nowrap shrink-0 ${
                      isAdded
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 cursor-default'
                        : 'bg-rose-50 hover:bg-rose-100 text-rose-800 border-rose-200 cursor-pointer'
                    }`}
                  >
                    <span>{item.keyword}</span>
                    {isAdded ? (
                      <Check className="w-3 h-3 text-emerald-600" />
                    ) : (
                      <Plus className="w-3 h-3 text-rose-700" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* JD-Tailored Summary Ready Preview */}
      {report.tailoredSummary && (
        <section className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                JD-Tailored Professional Summary Ready
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Auto-drafted from your background and aligned with {report.detectedJobMeta.title} requirements.
              </p>
            </div>
            <button
              type="button"
              onClick={onOpenBuilder}
              className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 self-start sm:self-auto transition-colors cursor-pointer"
            >
              Edit in LaTeX Builder
            </button>
          </div>
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
            {report.tailoredSummary}
          </p>
        </section>
      )}

      {/* Formatting & Parser Checks */}
      <section className="bg-white border border-slate-200 rounded-xl p-5">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Parser &amp; Structural Safety</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Automated compatibility checks for Taleo, Workday, Greenhouse, and Lever.
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-700 font-mono tabular-nums">
            {report.categories.formattingSafety}% safe
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {report.formattingChecks.map((check) => (
            <div key={check.label} className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold">
                {check.status === 'pass' ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                ) : check.status === 'warning' ? (
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                )}
                <span className="text-slate-900">{check.label}</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed pl-5">{check.detail}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Prioritized Action Plan */}
      <section className="bg-white border border-slate-200 rounded-xl p-5">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Prioritized Action Plan</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Apply targeted improvements directly to your live ATS resume draft.
            </p>
          </div>
          <span className="text-xs font-semibold text-indigo-700 tabular-nums">
            {report.actionPlan.length} recommendations
          </span>
        </div>

        {report.actionPlan.length === 0 ? (
          <p className="text-xs text-slate-600 py-3">
            Your resume is well-aligned. Open the ATS Builder to export your final PDF or TXT file.
          </p>
        ) : (
          <div className="divide-y divide-slate-100">
            {report.actionPlan.map((item) => (
              <div
                key={item.id}
                className="py-4 first:pt-0 last:pb-0 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 max-w-3xl">
                  <div className="flex items-center gap-2 text-xs">
                    <span
                      className={`font-bold ${
                        item.priority === 'high' ? 'text-rose-700' : 'text-amber-700'
                      }`}
                    >
                      {item.priority === 'high' ? 'High Priority' : 'Recommended'}
                    </span>
                    <span aria-hidden="true" className="text-slate-300">
                      ·
                    </span>
                    <span className="text-slate-500 font-medium">{item.category}</span>
                  </div>
                  <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                  <p className="text-xs text-slate-600 leading-relaxed">{item.description}</p>
                  {item.beforeText && item.afterText && (
                    <div className="pt-1 text-xs space-y-1">
                      <p className="text-slate-400 line-through">{item.beforeText}</p>
                      <p className="text-emerald-700 font-medium">{item.afterText}</p>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => onApplyActionPlan(item)}
                  className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 self-start md:self-center transition-colors cursor-pointer"
                >
                  {item.keywordsToAdd?.length
                    ? 'Insert into Skills'
                    : item.afterText
                      ? 'Apply Suggestion'
                      : 'Fix in Builder'}
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
