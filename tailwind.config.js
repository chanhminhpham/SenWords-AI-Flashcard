/** @type {import('tailwindcss').Config} */
// Color values duplicated from src/theme/colors.ts — keep in sync!
module.exports = {
  darkMode: 'media', // NativeWind v4 default, do NOT change to 'class'
  content: ['./app/**/*.{js,ts,tsx}', './src/**/*.{js,ts,tsx}'],

  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // ── Nature (primary brand) ──────────────────────
        nature: {
          accent: '#2D8A5E',
          'accent-dark': '#3DAA72',
          tint: '#E8F4ED',
          warm: '#FFF8F0',
        },
        // ── Sky ─────────────────────────────────────────
        sky: {
          blue: '#4A9FE5',
          'blue-dark': '#6BB5F0',
          text: '#2B7ABF',
          'text-dark': '#6BB5F0',
        },
        // ── Lotus ───────────────────────────────────────
        lotus: {
          pink: '#E8739E',
          'pink-dark': '#F09EBE',
        },
        // ── Feedback ────────────────────────────────────
        feedback: {
          know: '#4ECBA0',
          'know-dark': '#3DAA72',
          'dont-know': '#F5A623',
          'dont-know-dark': '#F0B848',
          'dont-know-text': '#C47D0A',
          'dont-know-text-dark': '#F0B848',
          explore: '#9B72CF',
          'explore-dark': '#B99ADE',
          info: '#4A9FE5',
          'info-dark': '#6BB5F0',
          error: '#E57373',
          'error-dark': '#FF8A80',
        },
        // ── Depth layers ────────────────────────────────
        depth: {
          layer1: '#4ECBA0',
          'layer1-dark': '#3DAA72',
          layer2: '#4A9FE5',
          'layer2-dark': '#6BB5F0',
          layer3: '#9B72CF',
          'layer3-dark': '#B99ADE',
          layer4: '#F5A623',
          'layer4-dark': '#F0B848',
        },
        // ── Surfaces ────────────────────────────────────
        'app-bg': '#FFFFFF',
        'app-bg-dark': '#1A2318',
        'app-surface': '#F5F7FA',
        'app-surface-dark': '#243028',
        'app-text': '#1A1D23',
        'app-text-dark': '#E8F4ED',
        // ── Dark mode form borders ──────────────────────
        form: {
          'border-default': '#3A4A3E',
          'border-focus': '#3DAA72',
          'border-error': '#FF8A80',
          placeholder: '#6B7B6F',
        },
      },
      // ── Spacing (8px base grid) ─────────────────────────
      spacing: {
        xs: '4px',
        sm: '8px',
        md: '16px',
        lg: '24px',
        xl: '32px',
        '2xl': '48px',
      },
      // ── Border Radius ───────────────────────────────────
      borderRadius: {
        card: '16px',
        button: '12px',
        chip: '8px',
        bubble: '20px',
      },
      // ── Typography ──────────────────────────────────────
      fontSize: {
        'flash-word': ['32px', { lineHeight: '44px', fontWeight: '700' }],
        h1: ['28px', { lineHeight: '36px', fontWeight: '700' }],
        h2: ['22px', { lineHeight: '30px', fontWeight: '600' }],
        h3: ['18px', { lineHeight: '26px', fontWeight: '600' }],
        body: ['16px', { lineHeight: '26px', fontWeight: '400' }],
        'body-sm': ['14px', { lineHeight: '22px', fontWeight: '400' }],
        caption: ['12px', { lineHeight: '18px', fontWeight: '500' }],
      },
    },
  },
  plugins: [],
};
