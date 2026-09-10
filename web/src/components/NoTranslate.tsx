import React from 'react';

interface NoTranslateProps {
  children: React.ReactNode;
  as?: keyof React.JSX.IntrinsicElements;
  className?: string;
}

/**
 * Wraps text/content so Google Translate, Safari, and other automated translators
 * skip and preserve the original text (e.g. brand names, trademarks, codes).
 */
export function NoTranslate({
  children,
  as: Component = 'span',
  className = ''
}: NoTranslateProps) {
  return (
    <Component translate="no" className={`notranslate ${className}`.trim()}>
      {children}
    </Component>
  );
}
