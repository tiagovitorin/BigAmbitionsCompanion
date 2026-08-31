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
        'bg-main':     'var(--bg-main)',
        'bg-sidebar':  'var(--bg-sidebar)',
        'bg-elevated': 'var(--bg-elevated)',
        'bg-subtle':   'var(--bg-subtle)',
        'border-default': 'var(--border-default)',
        'border-strong':  'var(--border-strong)',
        'txt-primary':   'var(--text-primary)',
        'txt-secondary': 'var(--text-secondary)',
        'txt-tertiary':  'var(--text-tertiary)',
        'txt-accent':    'var(--text-accent)',
        'accent':     'var(--accent)',
        'positive':   'var(--positive)',
        'negative':   'var(--negative)',
        'warning-color': 'var(--warning)',
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Inter', 'Segoe UI', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
};

