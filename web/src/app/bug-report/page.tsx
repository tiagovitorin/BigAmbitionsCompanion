'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useModal } from '@/context/ModalContext';
import { useTranslation } from '@/context/LanguageContext';

export default function BugReportRedirectPage() {
  const router = useRouter();
  const { openBugReport } = useModal();
  const { t } = useTranslation();

  useEffect(() => {
    // Open the floating modal and redirect back to previous or home page
    openBugReport();
    router.replace('/');
  }, [openBugReport, router]);

  return (
    <div className="flex items-center justify-center min-h-[50vh] text-center p-6">
      <div className="space-y-3">
        <div className="w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-[var(--text-muted)]">{t('bugReport.opening', 'Opening Bug Reporter...')}</p>
      </div>
    </div>
  );
}
