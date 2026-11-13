import type { ResumeData } from '../types/ats';

export const SAMPLE_JOB_URL = 'https://boards.greenhouse.io/stripe/jobs/493201';

export const SAMPLE_JOB_DESCRIPTION = `Role: Senior Product Analyst (Growth & Retention)
Company: Stripe (Fintech)
Location: Remote / New York

We are looking for a Senior Product Analyst to drive retention modeling and product telemetry.

Key Qualifications:
• 4+ years of data analysis or product analytics experience in high-growth SaaS.
• Expert proficiency in SQL (window functions, CTEs) and Python or R for data munging.
• Deep experience building executive Tableau & Looker dashboards tracking North Star metrics.
• Proven track record partnering with Product Managers & Engineering on A/B experimentation and cohort retention analysis.
• Expertise in data modeling, dbt, Snowflake, and event tracking schemas (Segment, Amplitude).
• Strong stakeholder management and cross-functional communication.`;

export const SAMPLE_RESUME_TEXT = `ALEXANDER WRIGHT
alex.wright@email.com • (555) 234-5678 • San Francisco, CA • linkedin.com/in/alexwright

PROFESSIONAL SUMMARY
Data Analyst with 4+ years of experience in product data modeling, SQL query optimization, and executive dashboards. Skilled in deriving actionable insights to improve product conversion and user retention.

EXPERIENCE
Product Analyst | FinScale Technologies (2021 – Present)
• Built multi-touch attribution and weekly conversion dashboards in Tableau used by VP of Product.
• Wrote complex SQL queries across 10M+ transaction tables to identify churn factors.
• Collaborated with engineering to define event taxonomy and tracking schemas for onboarding funnel.

Data Analyst | DataLoop Labs (2019 – 2021)
• Conducted cohort analysis with Python (pandas, numpy) and automated weekly metric reports.
• Reduced dashboard query execution time by 35% through query refactoring and index optimization.

SKILLS
SQL, Python, Tableau, Looker, ETL Pipelines, Cohort Retention, KPI Tracking, Statistical Modeling

EDUCATION
B.S. in Computer Science & Statistics
University of California, Berkeley
2019`;

export const DEFAULT_BUILDER_RESUME: ResumeData = {
  name: 'Alexander Wright',
  email: 'alex.wright@email.com',
  phone: '(555) 234-5678',
  location: 'San Francisco, CA',
  linkedin: 'linkedin.com/in/alexwright',
  summary:
    'Data Analyst with 4+ years of experience in product data modeling, SQL query optimization, and executive BI dashboards. Skilled in deriving actionable insights to improve product conversion and user retention.',
  skills: [
    'SQL (Window Functions, CTEs)',
    'Python (pandas, numpy)',
    'Tableau',
    'Looker',
    'ETL Pipelines',
    'Cohort Retention',
    'KPI Tracking',
    'Statistical Modeling',
  ],
  experiences: [
    {
      id: 'exp-1',
      title: 'Product Analyst',
      company: 'FinScale Technologies',
      location: 'San Francisco, CA',
      dates: '2021 – Present',
      bullets: [
        'Built multi-touch attribution and weekly conversion dashboards in Tableau used by VP of Product.',
        'Wrote complex SQL queries across 10M+ transaction tables to identify churn factors.',
        'Collaborated with engineering to define event taxonomy and tracking schemas for onboarding funnel.',
      ],
    },
    {
      id: 'exp-2',
      title: 'Data Analyst',
      company: 'DataLoop Labs',
      location: 'New York, NY',
      dates: '2019 – 2021',
      bullets: [
        'Conducted cohort analysis with Python (pandas, numpy) and automated weekly metric reports saving 12 hours weekly.',
        'Reduced dashboard query execution time by 35% through query refactoring and index optimization.',
      ],
    },
  ],
  education: {
    degree: 'B.S. in Computer Science & Statistics',
    school: 'University of California, Berkeley',
    year: '2019',
    certifications: 'SQL Analytics Specialization',
  },
};
