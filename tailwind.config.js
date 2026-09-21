/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx}', './components/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: { 50:'#eef2ff',100:'#e0e7ff',200:'#c7d2fe',300:'#a5b4fc',400:'#818cf8',500:'#6366f1',600:'#4f46e5',700:'#4338ca' },
        surface: { 800:'#1e293b',900:'#0f172a',950:'#020617' },
      },
      animation: {
        'fade-in': 'fadeIn .5s ease-out',
        'slide-up': 'slideUp .5s ease-out',
      },
      keyframes: {
        fadeIn: { '0%':{opacity:0}, '100%':{opacity:1} },
        slideUp: { '0%':{opacity:0,transform:'translateY(24px)'}, '100%':{opacity:1,transform:'translateY(0)'} },
      },
    },
  },
  plugins: [],
};
