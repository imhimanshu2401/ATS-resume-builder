import type {
  ActionPlanItem,
  AtsAnalysisReport,
  DetectedJobMeta,
  ExperienceItem,
  FormattingCheck,
  MissingKeyword,
  ResumeData,
} from '../types/ats';

const TECH_AND_DOMAIN_TERMS = [
  'SQL',
  'Window Functions',
  'CTEs',
  'Python',
  'R',
  'Tableau',
  'Looker',
  'Power BI',
  'Snowflake',
  'dbt',
  'BigQuery',
  'Redshift',
  'PostgreSQL',
  'MySQL',
  'Spark',
  'Airflow',
  'Kafka',
  'Segment',
  'Amplitude',
  'Mixpanel',
  'Google Analytics',
  'A/B Experimentation',
  'A/B Testing',
  'Experimentation',
  'Cohort Retention',
  'Retention Modeling',
  'Data Modeling',
  'ETL Pipelines',
  'ELT',
  'KPI Tracking',
  'North Star Metrics',
  'Product Telemetry',
  'Event Tracking',
  'Statistical Modeling',
  'Stakeholder Management',
  'Cross-Functional Communication',
  'TypeScript',
  'JavaScript',
  'React',
  'Next.js',
  'Node.js',
  'Express',
  'GraphQL',
  'REST API',
  'Docker',
  'Kubernetes',
  'AWS',
  'GCP',
  'Azure',
  'Terraform',
  'CI/CD',
  'Git',
  'Java',
  'Go',
  'Rust',
  'C++',
  'PyTorch',
  'TensorFlow',
  'Machine Learning',
  'LLM',
  'RAG',
  'Product Management',
  'Roadmap Strategy',
  'User Research',
  'Agile',
  'Scrum',
  'Jira',
  'Figma',
  'Design Systems',
  'Tailwind CSS',
  'Accessibility',
  'WCAG',
  'Financial Modeling',
  'Forecasting',
  'Revenue Operations',
  'Salesforce',
  'HubSpot',
  'SaaS',
  'Fintech',
  'B2B',
  'Growth',
  'Conversion Optimization',
  'Attribution Modeling',
  'Data Munging',
  'pandas',
  'numpy',
  'Excel',
];

const STOP_WORDS = new Set([
  'the', 'and', 'for', 'with', 'that', 'this', 'from', 'are', 'will', 'you', 'our',
  'your', 'have', 'has', 'been', 'into', 'across', 'about', 'more', 'years', 'year',
  'experience', 'strong', 'proven', 'deep', 'expert', 'track', 'record', 'ability',
  'work', 'working', 'team', 'teams', 'role', 'location', 'remote', 'full', 'time',
  'high', 'growth', 'key', 'qualifications', 'requirements', 'responsibilities',
  'including', 'using', 'such', 'well', 'plus', 'preferred', 'minimum', 'degree',
]);

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function containsKeyword(haystack: string, keyword: string): boolean {
  const lower = haystack.toLowerCase();
  const kw = keyword.toLowerCase().trim();
  if (!kw) return false;
  if (kw.includes('/')) {
    return kw.split('/').some((part) => containsKeyword(haystack, part.trim()));
  }
  const escaped = escapeRegExp(kw);
  const pattern = new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, 'i');
  return pattern.test(lower);
}

export function extractKeywordsFromJD(jobDescription: string): string[] {
  const found: string[] = [];
  const seenLower = new Set<string>();

  for (const term of TECH_AND_DOMAIN_TERMS) {
    if (containsKeyword(jobDescription, term)) {
      const key = term.toLowerCase();
      if (!seenLower.has(key)) {
        seenLower.add(key);
        found.push(term);
      }
    }
  }

  // Also extract capitalized multi-word or domain phrases if few catalog terms matched
  if (found.length < 8) {
    const tokens = jobDescription
      .replace(/[^\w\s/+.-]/g, ' ')
      .split(/\s+/)
      .filter((t) => t.length >= 3 && !STOP_WORDS.has(t.toLowerCase()));

    for (const token of tokens) {
      const cleaned = token.replace(/^[.-]+|[.-]+$/g, '');
      if (cleaned.length < 3 || STOP_WORDS.has(cleaned.toLowerCase())) continue;
      if (/^[A-Z][a-zA-Z0-9+.#/-]{1,}$/.test(cleaned)) {
        const key = cleaned.toLowerCase();
        if (!seenLower.has(key)) {
          seenLower.add(key);
          found.push(cleaned);
        }
      }
      if (found.length >= 16) break;
    }
  }

  return found.slice(0, 18);
}

export function detectJobMetadata(jobDescription: string): DetectedJobMeta {
  const lines = jobDescription
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  let title = 'Target Role';
  let company = 'Hiring Organization';
  let location = 'Remote / Hybrid';
  let employmentType = 'Full-Time';

  for (const line of lines.slice(0, 8)) {
    const roleMatch = line.match(/^(?:role|title|position|job title)\s*[:\-]\s*(.+)$/i);
    if (roleMatch) {
      title = roleMatch[1].trim();
      continue;
    }
    const companyMatch = line.match(/^(?:company|organization|employer)\s*[:\-]\s*(.+)$/i);
    if (companyMatch) {
      company = companyMatch[1].trim();
      continue;
    }
    const locMatch = line.match(/^(?:location|office)\s*[:\-]\s*(.+)$/i);
    if (locMatch) {
      location = locMatch[1].trim();
      continue;
    }
  }

  if (title === 'Target Role' && lines.length > 0) {
    const first = lines[0].replace(/^(?:about the role|job description)\s*[:\-]?\s*/i, '').trim();
    if (first.length > 3 && first.length <= 68) {
      title = first;
    }
  }

  if (/contract|freelance/i.test(jobDescription)) employmentType = 'Contract';
  else if (/part[-\s]?time/i.test(jobDescription)) employmentType = 'Part-Time';
  else if (/intern/i.test(jobDescription)) employmentType = 'Internship';

  if (company === 'Hiring Organization') {
    if (/\bstripe\b/i.test(jobDescription)) company = 'Stripe · Fintech';
    else if (/\bfintech\b/i.test(jobDescription)) company = 'Fintech';
    else if (/\bsaas\b/i.test(jobDescription)) company = 'B2B SaaS';
  }

  const keywords = extractKeywordsFromJD(jobDescription);
  return {
    title: title.slice(0, 60),
    company: company.slice(0, 42),
    employmentType,
    location: location.slice(0, 40),
    keywordCount: keywords.length,
  };
}

export function parseResumePlainText(resumeText: string): ResumeData {
  const lines = resumeText.split('\n').map((l) => l.trim());
  const nonEmpty = lines.filter(Boolean);

  const name = nonEmpty[0] && nonEmpty[0].length <= 50 ? nonEmpty[0] : 'Candidate Name';

  const emailMatch = resumeText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const phoneMatch = resumeText.match(/(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
  const linkedinMatch = resumeText.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+/i);

  let location = 'San Francisco, CA';
  const contactLine = nonEmpty.slice(1, 3).join(' ');
  const locCandidates = contactLine
    .split(/[•|,]/)
    .map((s) => s.trim())
    .filter(
      (s) =>
        s.length > 2 &&
        s.length < 35 &&
        !s.includes('@') &&
        !s.includes('linkedin') &&
        !/\d{3}/.test(s),
    );
  if (locCandidates.length > 0) {
    // Rejoin City, State if split by comma
    const cityStateMatch = contactLine.match(/([A-Z][a-zA-Z\s]+,\s*[A-Z]{2})/);
    location = cityStateMatch ? cityStateMatch[1].trim() : locCandidates[0];
  }

  const sectionHeaders = [
    { key: 'summary', pattern: /^(?:professional\s+summary|summary|profile|objective)\b/i },
    { key: 'experience', pattern: /^(?:work\s+experience|professional\s+experience|experience|employment)\b/i },
    { key: 'skills', pattern: /^(?:core\s+skills|technical\s+skills|skills|competencies|technologies)\b/i },
    { key: 'education', pattern: /^(?:education|academic|certifications|education\s*&\s*certifications)\b/i },
  ];

  const buckets: Record<string, string[]> = {
    header: [],
    summary: [],
    experience: [],
    skills: [],
    education: [],
  };

  let activeSection = 'header';
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const matchedHeader = sectionHeaders.find((h) => h.pattern.test(trimmed) && trimmed.length <= 42);
    if (matchedHeader) {
      activeSection = matchedHeader.key;
      continue;
    }
    buckets[activeSection].push(trimmed);
  }

  const summary =
    buckets.summary.join(' ').trim() ||
    'Results-oriented professional with experience delivering measurable business outcomes and cross-functional technical execution.';

  const skillsRaw = buckets.skills.join(', ');
  const skills = skillsRaw
    .split(/[,•|;\n]/)
    .map((s) => s.replace(/^[\-\s]+/, '').trim())
    .filter((s) => s.length > 0 && s.length <= 55);

  const experiences: ExperienceItem[] = [];
  let currentRole: ExperienceItem | null = null;

  for (const line of buckets.experience) {
    const isBullet = /^[•\-*▪]/.test(line);
    if (!isBullet && (line.includes('|') || /\(\d{4}|\d{4}\s*[–\-]/.test(line))) {
      if (currentRole) experiences.push(currentRole);
      const dateMatch = line.match(/\(([^)]+)\)|\b((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)?\s*\d{4}\s*[–\-]\s*(?:Present|\d{4}))/i);
      const dates = dateMatch ? (dateMatch[1] || dateMatch[2]).trim() : '2021 – Present';
      const withoutDates = line.replace(/\([^)]+\)/g, '').trim();
      const parts = withoutDates.split('|').map((p) => p.trim());
      currentRole = {
        id: `exp-${experiences.length + 1}`,
        title: parts[0] || 'Role Title',
        company: parts[1] || 'Company Name',
        location: parts[2] || location,
        dates,
        bullets: [],
      };
    } else if (currentRole) {
      currentRole.bullets.push(line.replace(/^[•\-*▪]\s*/, '').trim());
    } else {
      currentRole = {
        id: 'exp-1',
        title: line,
        company: 'Organization',
        location,
        dates: '2021 – Present',
        bullets: [],
      };
    }
  }
  if (currentRole) experiences.push(currentRole);

  if (experiences.length === 0) {
    experiences.push({
      id: 'exp-1',
      title: 'Product Analyst',
      company: 'Organization',
      location,
      dates: '2021 – Present',
      bullets: ['Delivered core analytics and cross-functional reporting initiatives.'],
    });
  }

  const eduLines = buckets.education;
  const education = {
    degree: eduLines[0] || 'B.S. in Computer Science & Statistics',
    school: eduLines[1] || 'University',
    year: (eduLines.join(' ').match(/\b(19|20)\d{2}\b/)?.[0]) || '2019',
    certifications: eduLines.slice(2).join(' · ') || 'Relevant Technical Certifications',
  };

  return {
    name,
    email: emailMatch ? emailMatch[0] : 'candidate@email.com',
    phone: phoneMatch ? phoneMatch[0] : '(555) 000-0000',
    location,
    linkedin: linkedinMatch ? linkedinMatch[0] : 'linkedin.com/in/candidate',
    summary,
    skills: skills.length > 0 ? skills : ['SQL', 'Python', 'Data Analysis'],
    experiences,
    education,
  };
}

export function serializeResumeToText(resume: ResumeData): string {
  const header = `${resume.name}\n${[resume.email, resume.phone, resume.location, resume.linkedin]
    .filter(Boolean)
    .join(' | ')}`;
  const expText = resume.experiences
    .map(
      (exp) =>
        `${exp.title} | ${exp.company} (${exp.dates})\n${exp.bullets
          .filter((b) => b.trim())
          .map((b) => `- ${b}`)
          .join('\n')}`,
    )
    .join('\n\n');

  return [
    header,
    `PROFESSIONAL SUMMARY\n${resume.summary}`,
    `WORK EXPERIENCE\n${expText}`,
    `SKILLS\n${resume.skills.join(', ')}`,
    `EDUCATION\n${resume.education.degree} | ${resume.education.school} (${resume.education.year})\n${resume.education.certifications}`,
  ].join('\n\n');
}

export function evaluateFormattingSafety(resumeText: string): {
  score: number;
  checks: FormattingCheck[];
} {
  const hasSpecialBullets = /[•▪➢►★]/.test(resumeText);
  const hasTabsOrColumns = /\t{2,}| {8,}\S/.test(resumeText);
  const hasStandardSections =
    /(?:experience|employment)/i.test(resumeText) && /(?:skills|competencies)/i.test(resumeText);
  const hasContactInfo = /@/.test(resumeText) && /\d{3}/.test(resumeText);

  let score = 100;
  const checks: FormattingCheck[] = [
    {
      label: 'Single-Column Linear Flow',
      status: hasTabsOrColumns ? 'warning' : 'pass',
      detail: hasTabsOrColumns
        ? 'Wide multi-column spacing detected; convert to single-column flow.'
        : 'Zero multi-column tables or floating text boxes detected.',
    },
    {
      label: 'Standard Section Headers',
      status: hasStandardSections ? 'pass' : 'warning',
      detail: hasStandardSections
        ? 'Recognized Summary, Experience, and Skills sections.'
        : 'Add explicit EXPERIENCE and SKILLS headers for ATS segmentation.',
    },
    {
      label: 'Character & Delimiter Hygiene',
      status: hasSpecialBullets ? 'warning' : 'pass',
      detail: hasSpecialBullets
        ? 'Contains Unicode bullet symbols (•); replace with standard hyphens or pipe delimiters.'
        : 'Clean ASCII punctuation and pipe-delimited contact header.',
    },
    {
      label: 'Contact Metadata Parseability',
      status: hasContactInfo ? 'pass' : 'fail',
      detail: hasContactInfo
        ? 'Email and phone number cleanly extracted from header.'
        : 'Ensure email and phone appear in plain text at the top of the document.',
    },
  ];

  if (hasSpecialBullets) score -= 5;
  if (hasTabsOrColumns) score -= 12;
  if (!hasStandardSections) score -= 10;
  if (!hasContactInfo) score -= 15;

  return { score: Math.max(40, score), checks };
}

export function analyzeHeuristic(
  jobDescription: string,
  resumeText: string,
  includeParsedResume = true,
): AtsAnalysisReport {
  const jdKeywords = extractKeywordsFromJD(jobDescription);
  const detectedJobMeta = detectJobMetadata(jobDescription);

  const matchedKeywords: string[] = [];
  const missingKeywords: MissingKeyword[] = [];

  for (const kw of jdKeywords) {
    if (containsKeyword(resumeText, kw)) {
      matchedKeywords.push(kw);
    } else {
      const highPriorityTerms = [
        'sql', 'python', 'snowflake', 'dbt', 'a/b', 'experimentation',
        'segment', 'amplitude', 'retention', 'react', 'typescript', 'aws', 'tableau', 'looker',
      ];
      const isHigh = highPriorityTerms.some((t) => kw.toLowerCase().includes(t));
      missingKeywords.push({
        keyword: kw,
        impact: isHigh ? 'high' : 'medium',
        context: `Referenced in target job description; absent from your current resume text.`,
      });
    }
  }

  const keywordMatch =
    jdKeywords.length > 0
      ? Math.round((matchedKeywords.length / jdKeywords.length) * 100)
      : 72;

  const { score: formattingSafety, checks: formattingChecks } = evaluateFormattingSafety(resumeText);

  // Quantified impact score: count bullets with numbers/metrics (%, $, M+, K+, x, hours, ms)
  const bulletLines = resumeText
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => /^[•\-*▪]/.test(l));
  const quantifiedBullets = bulletLines.filter((b) =>
    /(\d+%|\$\d+|\d+[mk]\+?|\d+x\b|\b\d+\s+(?:hours|hrs|weeks|months|pipelines|teams|users))/i.test(b),
  );
  const quantifiedImpact =
    bulletLines.length > 0
      ? Math.min(98, Math.round(45 + (quantifiedBullets.length / bulletLines.length) * 53))
      : 55;

  // Role & Seniority Alignment
  const titleWords = detectedJobMeta.title
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 3 && !STOP_WORDS.has(w));
  const titleMatches = titleWords.filter((w) => resumeText.toLowerCase().includes(w)).length;
  const yearsMatch = /(\d+)\+\s*years/i.exec(jobDescription);
  const resumeHasYears = /(\d+)\+?\s*years/i.test(resumeText);
  let roleAlignment = titleWords.length > 0 ? Math.round(52 + (titleMatches / titleWords.length) * 35) : 72;
  if (yearsMatch && resumeHasYears) roleAlignment = Math.min(96, roleAlignment + 10);

  const overallScore = Math.min(
    99,
    Math.max(
      25,
      Math.round(
        keywordMatch * 0.44 +
          formattingSafety * 0.2 +
          quantifiedImpact * 0.18 +
          roleAlignment * 0.18,
      ),
    ),
  );

  const percentile = Math.min(98, Math.max(18, Math.round(overallScore * 1.06)));
  const tierLabel =
    overallScore >= 85
      ? 'Interview Ready'
      : overallScore >= 72
        ? 'Strong Contender'
        : overallScore >= 55
          ? 'Moderate Match'
          : 'Needs Tailoring';

  const topMissing = missingKeywords.slice(0, 4).map((m) => m.keyword);
  const projectedScore = Math.min(96, Math.max(overallScore + 4, overallScore + Math.min(18, missingKeywords.length * 3)));

  const summaryInsight =
    missingKeywords.length === 0
      ? 'Excellent keyword parity and clean parser hygiene across all four ATS vectors.'
      : `Solid baseline alignment. Integrating ${Math.min(4, missingKeywords.length)} missing target terms (${topMissing.slice(0, 3).join(', ')}) pushes your score above the ${Math.max(85, projectedScore)} interview threshold.`;

  const actionPlan: ActionPlanItem[] = [];

  if (missingKeywords.length > 0) {
    const firstBatch = missingKeywords.slice(0, 3).map((m) => m.keyword);
    actionPlan.push({
      id: 'act-keywords',
      priority: 'high',
      category: 'Missing Keywords',
      title: `Integrate high-weight terms: ${firstBatch.join(', ')}`,
      description: `These competencies appear in the target job qualifications and directly lift automated keyword ranking.`,
      keywordsToAdd: firstBatch,
    });
  }

  const weakBullet = bulletLines.find(
    (b) => !/(\d+%|\$\d+|\d+[mk]\+?|\d+x\b)/i.test(b) && b.length > 25,
  );
  if (weakBullet) {
    const cleanWeak = weakBullet.replace(/^[•\-*▪]\s*/, '');
    actionPlan.push({
      id: 'act-metrics',
      priority: 'high',
      category: 'Impact Upgrade',
      title: 'Quantify outcome metrics in experience bullets',
      description: 'Replace unmeasured responsibility statements with scope + measurable business delta.',
      beforeText: cleanWeak,
      afterText: `${cleanWeak.replace(/\.$/, '')}, driving a measurable 14% improvement in funnel conversion and reporting speed.`,
      targetRoleIndex: 0,
    });
  }

  const formatWarning = formattingChecks.find((c) => c.status !== 'pass');
  if (formatWarning) {
    actionPlan.push({
      id: 'act-format',
      priority: 'medium',
      category: 'Formatting Hygiene',
      title: formatWarning.label,
      description: formatWarning.detail,
    });
  }

  const parsedResume = includeParsedResume ? parseResumePlainText(resumeText) : undefined;
  const yearsClause = /(\d+\+?\s*years)/i.exec(resumeText)?.[1] || '4+ years';
  const coreMatched = matchedKeywords.slice(0, 4);
  const topMissingForSummary = missingKeywords.slice(0, 2).map((m) => m.keyword);
  const summaryFocusTerms = Array.from(new Set([...coreMatched, ...topMissingForSummary])).slice(0, 5);

  const tailoredSummary = `${detectedJobMeta.title} candidate with ${yearsClause} of experience delivering measurable product and operational outcomes. Specialized in ${
    summaryFocusTerms.length > 0 ? summaryFocusTerms.join(', ') : 'cross-functional analytics and execution'
  }, partnering closely with engineering and product stakeholders to drive retention, efficiency, and executive visibility.`;

  const existingSkills = parsedResume ? parsedResume.skills : [];
  const tailoredSkills = Array.from(
    new Set([...matchedKeywords, ...existingSkills, ...missingKeywords.slice(0, 4).map((m) => m.keyword)]),
  );

  return {
    overallScore,
    percentile,
    tierLabel,
    summaryInsight,
    projectedScore,
    categories: {
      keywordMatch,
      formattingSafety,
      quantifiedImpact,
      roleAlignment,
    },
    detectedJobMeta,
    matchedKeywords,
    missingKeywords,
    formattingChecks,
    actionPlan,
    parsedResume,
    tailoredSummary,
    tailoredSkills,
    source: 'heuristic',
  };
}
