const { current } = require('@reduxjs/toolkit');

/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all of your component files.
  content: ["./app/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  corePlugins: {
    backgroundOpacity: true,
  },
  theme: {
    extend: {
      colors: {
        'primary': '#121568',
        'secondary': '#191923',
        'accent': '#808080',
        'danger': '#BF310D',
        'success': '#00CC77'
      }
    },
  },
  plugins: [],
}