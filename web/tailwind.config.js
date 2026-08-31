/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'bg-base':             'var(--bg-base)',
        'bg-surface':          'var(--bg-surface)',
        'bg-surface-elevated': 'var(--bg-surface-elevated)',
        'bg-surface-hover':    'var(--bg-surface-hover)',
        'bg-surface-active':   'var(--bg-surface-active)',
        'border-subtle':       'var(--border-subtle)',
        'border-base':         'var(--border-base)',
        'border-strong':       'var(--border-strong)',
        'text-main':           'var(--text-main)',
        'text-muted':          'var(--text-muted)',
        'text-subtle':         'var(--text-subtle)',
        'primary-brand':       'var(--primary)',
        'emerald-accent':      'var(--emerald-accent)',
        'emerald-bg':          'var(--emerald-bg)',
        'emerald-border':      'var(--emerald-border)',
        'amber-accent':        'var(--amber-accent)',
        'amber-bg':            'var(--amber-bg)',
        'amber-border':        'var(--amber-border)',
        'rose-accent':         'var(--rose-accent)',
        'rose-bg':             'var(--rose-bg)',
        'rose-border':         'var(--rose-border)',
        'sky-accent':          'var(--sky-accent)',
        'sky-bg':              'var(--sky-bg)',
        'sky-border':          'var(--sky-border)',
        'indigo-accent':       'var(--indigo-accent)',
        'indigo-bg':           'var(--indigo-bg)',
        'indigo-border':       'var(--indigo-border)',
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Inter', 'Segoe UI', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
};

