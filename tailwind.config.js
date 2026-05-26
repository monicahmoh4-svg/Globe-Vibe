/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Syne"', 'sans-serif'],
        body:    ['"DM Sans"', 'sans-serif'],
      },
      colors: {
        primary: { 50:'#f0fdf9',100:'#ccfbee',200:'#99f6de',300:'#5eebc8',400:'#2dd4ac',500:'#0fb893',600:'#059278',700:'#067462',800:'#075c51',900:'#064c44' },
        accent:  { 400:'#fb923c', 500:'#f97316' },
        dark:    { 900:'#0a0f1a', 800:'#0f172a', 700:'#1e293b', 600:'#334155', 500:'#475569' },
      },
      animation: {
        'float':    'float 6s ease-in-out infinite',
        'slide-up': 'slideUp 0.4s ease-out',
        'fade-in':  'fadeIn 0.3s ease-out',
      },
      keyframes: {
        float:   { '0%,100%':{ transform:'translateY(0)' }, '50%':{ transform:'translateY(-10px)' } },
        slideUp: { from:{ opacity:'0', transform:'translateY(18px)' }, to:{ opacity:'1', transform:'translateY(0)' } },
        fadeIn:  { from:{ opacity:'0' }, to:{ opacity:'1' } },
      },
    },
  },
  plugins: [],
}
