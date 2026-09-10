'use client';

import React from 'react';
import { useTranslation } from '@/context/LanguageContext';

interface GameTextProps {
  id?: string | null;
  fallback?: string;
  as?: keyof React.JSX.IntrinsicElements;
  className?: string;
}

/**
 * Renders an official in-game string (from the 6,000+ Big Ambitions game database keys)
 * with translate="no" and class="notranslate" so Google Translate leaves the 100% authentic
 * official game translation untouched.
 */
export function GameText({
  id,
  fallback = '',
  as: Component = 'span',
  className = ''
}: GameTextProps) {
  const { tGame, locale } = useTranslation();
  const text = tGame(id, fallback);

  // If active locale is not English and we found a translation, wrap with notranslate so Google doesn't re-translate it
  return (
    <Component
      translate={locale !== 'en' ? 'no' : undefined}
      className={`${locale !== 'en' ? 'notranslate' : ''} ${className}`.trim()}
    >
      {text}
    </Component>
  );
}
