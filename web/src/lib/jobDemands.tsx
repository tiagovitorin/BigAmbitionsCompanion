import type { ComponentType, SVGProps } from 'react';
import {
  Clock,
  Moon,
  Sun,
  Sunrise,
  MoonStar,
  CalendarOff,
  CalendarDays,
  ShieldCheck,
  Leaf,
  Ban,
  Coffee,
  Droplets,
  Refrigerator,
  Sofa,
  Armchair,
  Mouse,
  Calculator,
  RectangleHorizontal,
  Phone,
  Monitor,
  CircleQuestionMark,
  MopSparkles
} from 'lucide-react';

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

export interface JobDemandMeta {
  icon: IconComponent;
  labelKey: string;
  label: string;
  tone: string;
}

const SKY = 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20';
const INDIGO = 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20';
const EMERALD = 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
const AMBER = 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
const ROSE = 'bg-rose-500/10 text-rose-500 border-rose-500/20';
const SLATE = 'bg-[var(--bg-base)] text-[var(--text-subtle)] border-[var(--border-base)]';

function meta(icon: IconComponent, key: string, label: string, tone: string): JobDemandMeta {
  return { icon, labelKey: `liveHq.demand_${key}`, label, tone };
}

const META: Record<string, JobDemandMeta> = {
  'ba:jobdemand_fulltime': meta(Clock, 'fulltime', 'Full time', SKY),
  'ba:jobdemand_parttime': meta(Clock, 'parttime', 'Part time', SLATE),
  'ba:jobdemand_noevenings': meta(Moon, 'noevenings', 'No evenings', INDIGO),
  'ba:jobdemand_noafternoons': meta(Sun, 'noafternoons', 'No afternoons', AMBER),
  'ba:jobdemand_nomornings': meta(Sunrise, 'nomornings', 'No mornings', AMBER),
  'ba:jobdemand_nonights': meta(MoonStar, 'nonights', 'No nights', INDIGO),
  'ba:jobdemand_freeweekends': meta(CalendarOff, 'freeweekends', 'Free weekends', EMERALD),
  'ba:jobdemand_fourdaysweek': meta(CalendarDays, 'fourdaysweek', '4-day work week', EMERALD),
  'ba:jobdemand_fivedaysweek': meta(CalendarDays, 'fivedaysweek', '5-day work week', EMERALD),
  'ba:jobdemand_bronzehealthinsurance': meta(ShieldCheck, 'bronzehealthinsurance', 'Bronze health insurance', AMBER),
  'ba:jobdemand_silverhealthinsurance': meta(ShieldCheck, 'silverhealthinsurance', 'Silver health insurance', SLATE),
  'ba:jobdemand_goldhealthinsurance': meta(ShieldCheck, 'goldhealthinsurance', 'Gold health insurance', EMERALD),
  'ba:jobdemand_peacefulworkenvironment': meta(Leaf, 'peacefulworkenvironment', 'Peaceful work environment', EMERALD),
  'ba:jobdemand_cleanworkplace': meta(MopSparkles, 'cleanworkplace', 'Clean workplace', SKY),
  'ba:jobdemand_nocleaning': meta(Ban, 'nocleaning', 'No cleaning duties', ROSE),
  'ba:jobdemand_coffeemachine': meta(Coffee, 'coffeemachine', 'Coffee machine', AMBER),
  'ba:jobdemand_watercooler': meta(Droplets, 'watercooler', 'Water cooler', SKY),
  'ba:jobdemand_standardfridge': meta(Refrigerator, 'standardfridge', 'Standard fridge', SKY),
  'ba:jobdemand_sofa': meta(Sofa, 'sofa', 'Sofa', SLATE),
  'ba:jobdemand_seatedatofficedesk1': meta(Armchair, 'seatedatofficedesk1', 'Seated at an office desk', SLATE),
  'ba:jobdemand_seatedatofficedesk2': meta(Armchair, 'seatedatofficedesk2', 'Seated at an office desk', SLATE),
  'ba:jobdemand_seatedatofficechair': meta(Armchair, 'seatedatofficechair', 'Office chair', SLATE),
  'ba:jobdemand_seatedatofficechair2': meta(Armchair, 'seatedatofficechair2', 'Office chair', SLATE),
  'ba:jobdemand_seatedatmultipurposechair': meta(Armchair, 'seatedatmultipurposechair', 'Multipurpose chair', SLATE),
  'ba:jobdemand_hasmousepad': meta(Mouse, 'hasmousepad', 'Mouse pad', SLATE),
  'ba:jobdemand_hascalculator': meta(Calculator, 'hascalculator', 'Calculator', SLATE),
  'ba:jobdemand_hasphone': meta(Phone, 'hasphone', 'Phone', SLATE),
  'ba:jobdemand_hascomputermonitor': meta(Monitor, 'hascomputermonitor', 'Computer monitor', SLATE),
  'ba:jobdemand_hasofficephone': meta(Phone, 'hasofficephone', 'Office phone', SLATE),
  'ba:jobdemand_largemeetingtable': meta(RectangleHorizontal, 'largemeetingtable', 'Large meeting table', SLATE)
};

export function getJobDemandMeta(rawName?: string, fallbackName?: string): JobDemandMeta {
  if (rawName && META[rawName]) return META[rawName];
  return { icon: CircleQuestionMark, labelKey: '', label: fallbackName || rawName || 'Demand', tone: SLATE };
}
