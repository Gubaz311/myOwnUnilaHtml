/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js}",
  ],
  darkMode:'class',
  theme: {
    container:{
      center: true,
    },
    extend: {
      fontFamily :{
        aktivThin: ['aktiv-grotesk-thin', 'sans-serif'],
        aktivRegular: ['aktiv-grotesk-regular', 'sans-serif'],
        aktivMedium: ['aktiv-grotesk-medium', 'sans-serif'],
        aktivBold: ['aktiv-grotesk-bold', 'sans-serif'],
        aktivLight: ['aktiv-grotesk-light', 'sans-serif'],
      },
      colors:{
        lightHeader :'rgba(199, 210, 254, 1)',
        lightMain: 'rgba(244, 244, 239, 1)',
        lightContainer: 'rgba(234, 234, 225, 1) ',
        lightText: 'rgba(31, 41, 55, 1)',
        lightIcon: 'rgba(34, 37, 42, 1)',
        lightIconFocus: 'rgba(2, 132, 199, 1)',
        lightFooter : 'rgba(165, 180, 252, 1)',

        darkHeader:'rgba(22, 17, 78, 1)',
        darkMain:'rgba(40, 35, 91, 1)',
        darkContainer:'rgba(32, 29, 73, 1)',
        darkText:'rgba(230, 220, 230, 1)',
        darkIcon : 'rgba(209, 213, 219, 1) ',
        darkIconFocus: 'rgba(14, 165, 233, 1)',
        darkFooter:'rgba(2, 132, 199, 1)',
      },
    },
  },
  plugins: [],
}

