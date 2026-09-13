'use client';

import { ProductionSectionProps } from '@/lib/productionUi';
import FactoryStaffingMatrix from './FactoryStaffingMatrix';

export default function FactoryWorkforceSection({ model, ctx }: ProductionSectionProps) {
  return <FactoryStaffingMatrix model={model} ctx={ctx} />;
}
