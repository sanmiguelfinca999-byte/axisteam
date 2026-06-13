/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        axis: {
          void:    '#06091F',
          deep:    '#0D1438',
          edge:    '#1F2A5E',
          text:    '#E8ECFF',
          dim:     '#7A8AB8',
          glow:    '#5B8DEF',
          pulse:   '#00D9FF',
          flare:   '#FF5470',
          solar:   '#FFB547',
          leaf:    '#22D3A8',
          purple:  '#8B5CF6',
        },
        nexus: {
          bg:      '#0a0e27',
          surface: '#0f1535',
          border:  '#1e2a5e',
          text:    '#e0e6ff',
          muted:   '#6b7db3',
          green:   '#10b981',
          yellow:  '#f59e0b',
          red:     '#ef4444',
          blue:    '#3b82f6',
          purple:  '#8b5cf6',
        },
      },
      animation: {
        'pulse-red': 'pulse-red 1s ease-in-out infinite',
        'fade-in':   'fadeIn 0.3s ease-out',
        'slide-in':  'slideIn 0.3s ease-out',
        'blink':     'blink 0.8s step-end infinite',
        'orbit':     'orbit 60s linear infinite',
      },
      keyframes: {
        'pulse-red': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(239,68,68,0)' },
          '50%':      { boxShadow: '0 0 0 8px rgba(239,68,68,0.4)' },
        },
        fadeIn:  { from: { opacity: 0 }, to: { opacity: 1 } },
        slideIn: { from: { transform: 'translateX(100%)', opacity: 0 }, to: { transform: 'translateX(0)', opacity: 1 } },
        blink:   { '0%, 100%': { opacity: 1 }, '50%': { opacity: 0 } },
        orbit:   { from: { transform: 'rotate(0deg)' }, to: { transform: 'rotate(360deg)' } },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'Inter', 'system-ui', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
    },
  },
  plugins: [],
}
