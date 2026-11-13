export type ActiveView = 'input' | 'report' | 'builder';
export type TemplateStyle = 'jake-latex' | 'modern-sans';
export type FontScale = 'compact' | 'standard' | 'large';
export type BuilderEditorMode = 'form' | 'latex';

export interface ExperienceItem {
  id: string;
  title: string;
  company: string;
  location: string;
  dates: string;
  bullets: string[];
}

export interface EducationItem {
  degree: string;
  school: string;
  year: string;
  certifications: string;
}

export interface ResumeData {
  name: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  summary: string;
  skills: string[];
  experiences: ExperienceItem[];
  education: EducationItem;
}

export interface CategoryScores {
  keywordMatch: number;
  formattingSafety: number;
  quantifiedImpact: number;
  roleAlignment: number;
}

export interface MissingKeyword {
  keyword: string;
  impact: 'high' | 'medium';
  context: string;
}

export interface FormattingCheck {
  label: string;
  status: 'pass' | 'warning' | 'fail';
  detail: string;
}

export interface ActionPlanItem {
  id: string;
  priority: 'high' | 'medium';
  category: string;
  title: string;
  description: string;
  beforeText?: string;
  afterText?: string;
  keywordsToAdd?: string[];
  targetRoleIndex?: number;
}

export interface DetectedJobMeta {
  title: string;
  company: string;
  employmentType: string;
  location: string;
  keywordCount: number;
}

export interface AtsAnalysisReport {
  overallScore: number;
  percentile: number;
  tierLabel: string;
  summaryInsight: string;
  projectedScore: number;
  categories: CategoryScores;
  detectedJobMeta: DetectedJobMeta;
  matchedKeywords: string[];
  missingKeywords: MissingKeyword[];
  formattingChecks: FormattingCheck[];
  actionPlan: ActionPlanItem[];
  parsedResume?: ResumeData;
  tailoredSummary?: string;
  tailoredSkills?: string[];
  source: 'gemini' | 'heuristic';
}
