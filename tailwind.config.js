/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        'bg-primary':  '#0D1B2A',
        'bg-card':     '#19293E',
        'bg-sidebar':  '#0D1B2A',
        'border':      '#2A3D55',
        'active':      '#006DFF',
        'idle':        '#9BD9FF',
        'warning':     '#F9CB3B',
        'critical':    '#FF1F3F',
        'text-primary':'#E0E6ED',
        'text-muted':  '#7A8FA6',
      },
    },
  },
  plugins: [],
}
