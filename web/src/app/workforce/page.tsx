'use client';

import { GraduationCap, Wrench, Users, TrendingUp, ListChecks } from 'lucide-react';

import rawDiplomas from '@/data/diplomas.json';
import rawSkills from '@/data/skills.json';
import { useTranslation } from '@/context/LanguageContext';

const DIPLOMA_NAMES: Record<string, string> = {
  FoodSafetyCourse: 'Food Safety Course',
  AutoMechanicEducation: 'Auto Mechanic Education',
  BasicHr: 'Basic HR',
  Headquarters: 'Headquarters',
  MarketDemands: 'Market Demands',
  OfficeBusinesses: 'Office Businesses',
  ProductManufacturing: 'Product Manufacturing',
};

const SKILL_NAMES: Record<string, string> = {
  actor: 'Actor',
  cleaning: 'Cleaning',
  customerservice: 'Customer Service',
  deliverydriver: 'Delivery Driver',
  dj: 'DJ',
  eventplanner: 'Event Planner',
  factoryworker: 'Factory Worker',
  graphicdesigner: 'Graphic Designer',
  gymtrainer: 'Gym Trainer',
  hairstylist: 'Hair Stylist',
  headhunter: 'Headhunter',
  hrmanager: 'HR Manager',
  lawyer: 'Lawyer',
  logisticsmanager: 'Logistics Manager',
  pricingmanager: 'Pricing Manager',
  programmer: 'Programmer',
  projectionist: 'Projectionist',
  purchasingagent: 'Purchasing Agent',
  securityguard: 'Security Guard',
  stagecrew: 'Stage Crew',
  travelagent: 'Travel Agent',
};

function skillDisplay(raw: string): string {
  return SKILL_NAMES[raw.replace('ba:skill_', '')] || raw.replace('ba:skill_', '');
}

export default function WorkforcePage() {
  const { t } = useTranslation();

  const diplomas = (rawDiplomas as any[]).map((d) => ({
    name: DIPLOMA_NAMES[d.diplomaName] || d.diplomaName,
    minutes: d.requiredMinutes,
  }));

  const skills = (rawSkills as any[]).map((s) => skillDisplay(s.skillName));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-[var(--text-main)] flex items-center gap-2">
          <Users className="w-5 h-5 text-violet-500" />
          <span>{t('workforce.title', 'Workforce & Education Compendium')}</span>
        </h1>
        <p className="text-xs text-[var(--text-muted)] mt-1">
          {t('workforce.subtitle', 'Business school diplomas, employee skills, and how worker skill scales output.')}
        </p>
      </div>

      {/* Diplomas */}
      <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] shadow-sm space-y-3">
        <h2 className="text-sm font-bold text-[var(--text-main)] flex items-center gap-2">
          <GraduationCap className="w-4 h-4 text-violet-500" />
          <span>{t('workforce.diplomas', 'Business School Diplomas')}</span>
        </h2>
        <p className="text-xs text-[var(--text-muted)]">
          {t('workforce.diplomasDesc', 'Completed at the Manhattan Business School. Several diplomas gate higher-tier businesses, offices, and factories.')}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {diplomas.map((d) => (
            <div key={d.name} className="flex items-center justify-between p-2.5 rounded-lg bg-[var(--bg-base)] border border-[var(--border-base)] text-xs">
              <span className="font-semibold text-[var(--text-main)]">{d.name}</span>
              <span className="font-mono text-[var(--text-subtle)]">
                {d.minutes != null
                  ? t('workforce.hoursValue', '{hours} hrs').replace('{hours}', Math.round(d.minutes / 60).toString())
                  : t('workforce.durationUnknown', 'Duration varies')}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Skill scaling */}
      <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] shadow-sm space-y-3">
        <h2 className="text-sm font-bold text-[var(--text-main)] flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-violet-500" />
          <span>{t('workforce.skillScaling', 'Worker Skill Scaling')}</span>
        </h2>
        <div className="p-3 rounded-xl bg-[var(--bg-base)] border border-[var(--border-base)]">
          <div className="font-mono font-bold text-[var(--text-main)] text-sm">
            {t('workforce.skillFormula', 'output = base x (0.5 + skill / 200)')}
          </div>
          <div className="text-xs text-[var(--text-muted)] mt-1.5">
            {t('workforce.skillFormulaDesc', 'A factory worker at 0% skill produces 50% of the base batch. At 100% skill they produce the full amount. Train employees to raise their primary skill and output.')}
          </div>
        </div>
      </div>

      {/* Job demands overview */}
      <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] shadow-sm space-y-3">
        <h2 className="text-sm font-bold text-[var(--text-main)] flex items-center gap-2">
          <ListChecks className="w-4 h-4 text-violet-500" />
          <span>{t('workforce.jobDemands', 'Employee Job Demands')}</span>
        </h2>
        <p className="text-xs text-[var(--text-muted)]">
          {t('workforce.jobDemandsDesc', 'Employees request perks and conditions. Fulfill them to keep morale high and prevent them from being poached by rivals.')}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-xs">
          <div className="p-3 rounded-lg bg-[var(--bg-base)] border border-[var(--border-base)]">
            <div className="font-bold text-[var(--text-main)]">{t('workforce.demandSchedule', 'Schedule')}</div>
            <div className="text-[var(--text-subtle)] mt-0.5">{t('workforce.demandScheduleDesc', 'Days per week, time of day, and weekend preferences.')}</div>
          </div>
          <div className="p-3 rounded-lg bg-[var(--bg-base)] border border-[var(--border-base)]">
            <div className="font-bold text-[var(--text-main)]">{t('workforce.demandInsurance', 'Health Insurance')}</div>
            <div className="text-[var(--text-subtle)] mt-0.5">{t('workforce.demandInsuranceDesc', 'Bronze, silver, or gold coverage plans.')}</div>
          </div>
          <div className="p-3 rounded-lg bg-[var(--bg-base)] border border-[var(--border-base)]">
            <div className="font-bold text-[var(--text-main)]">{t('workforce.demandEquipment', 'Office Equipment')}</div>
            <div className="text-[var(--text-subtle)] mt-0.5">{t('workforce.demandEquipmentDesc', 'Desks, chairs, monitors, computers, phones, and coffee machines.')}</div>
          </div>
          <div className="p-3 rounded-lg bg-[var(--bg-base)] border border-[var(--border-base)]">
            <div className="font-bold text-[var(--text-main)]">{t('workforce.demandEnvironment', 'Environment')}</div>
            <div className="text-[var(--text-subtle)] mt-0.5">{t('workforce.demandEnvironmentDesc', 'Clean workplaces, peaceful settings, and no cleaning duties.')}</div>
          </div>
        </div>
      </div>

      {/* Skills */}
      <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] shadow-sm space-y-3">
        <h2 className="text-sm font-bold text-[var(--text-main)] flex items-center gap-2">
          <Wrench className="w-4 h-4 text-violet-500" />
          <span>{t('workforce.skills', 'Employee Skills')}</span>
        </h2>
        <div className="flex flex-wrap gap-2">
          {skills.map((name) => (
            <span key={name} className="text-xs font-medium px-2.5 py-1 rounded-full bg-[var(--bg-base)] border border-[var(--border-base)] text-[var(--text-main)]">
              {name}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
