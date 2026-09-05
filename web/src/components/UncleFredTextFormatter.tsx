'use client';

import React from 'react';
import Link from 'next/link';
import { BusinessStoreTelemetry } from '@/lib/uncleFredAi';

interface TextFormatterProps {
  text: string;
  businesses: BusinessStoreTelemetry[];
  onNavigateStore?: (storeId: string) => void;
}

export function FormattedUncleFredText({ text, businesses, onNavigateStore }: TextFormatterProps) {
  // Build a lookup map of businesses by lowercase trimmed name for fast, exact matching
  const businessMap = React.useMemo(() => {
    const map = new Map<string, BusinessStoreTelemetry>();
    for (const b of businesses) {
      if (b.name && b.name.trim().length >= 2) {
        map.set(b.name.trim().toLowerCase(), b);
      }
    }
    return map;
  }, [businesses]);

  // Regex pattern matching any registered business name (sorted longest first to avoid partial prefix collisions)
  const businessRegex = React.useMemo(() => {
    const names = Array.from(businessMap.keys()).sort((a, b) => b.length - a.length);
    if (names.length === 0) return null;
    const escaped = names.map(n => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
    return new RegExp(`\\b(${escaped})\\b`, 'gi');
  }, [businessMap]);

  // Helper to render text with inline store links (minimal styling: slight blue, cursor pointer, no border, no icon)
  const renderTextWithStoreLinks = (plainText: string, keyPrefix: string) => {
    if (!businessRegex) return plainText;

    const parts = plainText.split(businessRegex);
    return parts.map((part, idx) => {
      const match = businessMap.get(part.toLowerCase());
      if (match) {
        const href = match.id ? `/live-sync?view=stores&store=${match.id}` : `/live-sync?view=stores`;
        return (
          <Link
            key={`${keyPrefix}-store-${idx}`}
            href={href}
            onClick={() => {
              if (onNavigateStore && match.id) {
                onNavigateStore(match.id);
              }
            }}
            className="text-sky-600 dark:text-sky-400 font-semibold hover:underline cursor-pointer transition-colors"
            title={`Open ${match.name} details`}
          >
            {part}
          </Link>
        );
      }
      return part;
    });
  };

  // Helper to parse markdown bolding **text** while keeping inline store links
  const renderFormattedSegments = (chunk: string, lineIdx: number) => {
    const parts = chunk.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, pIdx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        const innerText = part.slice(2, -2);
        return (
          <strong key={`b-${lineIdx}-${pIdx}`} className="font-semibold text-slate-950 dark:text-white">
            {renderTextWithStoreLinks(innerText, `b-${lineIdx}-${pIdx}`)}
          </strong>
        );
      }
      return renderTextWithStoreLinks(part, `p-${lineIdx}-${pIdx}`);
    });
  };

  // Render lines with markdown bolding, lists, and linebreaks
  const renderMessageContent = (rawContent: string) => {
    const lines = rawContent.split('\n');
    return lines.map((line, lIdx) => {
      const trimmed = line.trim();
      const isBullet = /^[-*•]\s+/.test(trimmed);
      const isNumbered = /^\d+\.\s+/.test(trimmed);

      if (!trimmed) {
        return <div key={lIdx} className="h-1.5" />;
      }

      if (isBullet || isNumbered) {
        const cleanLine = trimmed.replace(/^([-*•]|\d+\.)\s+/, '');
        return (
          <div key={lIdx} className="flex items-start gap-1.5 pl-1 py-0.5">
            <span className="text-slate-400 font-bold shrink-0 text-[10px] select-none mt-0.5">
              {isNumbered ? trimmed.match(/^\d+\./)?.[0] : '•'}
            </span>
            <div className="flex-1">{renderFormattedSegments(cleanLine, lIdx)}</div>
          </div>
        );
      }

      return (
        <p key={lIdx} className="leading-relaxed">
          {renderFormattedSegments(line, lIdx)}
        </p>
      );
    });
  };

  return (
    <div className="space-y-1.5">
      <div>
        {renderMessageContent(text)}
      </div>
    </div>
  );
}

