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
        lightHeader :'#C7D2FE',
        lightMain: '#F4F4EF',
        lightContainer: '#F4F4EF ',
        lightText: '#1F2937',
        lightIcon: '#22252a',
        lightIconFocus: '#60A5FA',
        lightFooter : '#A5B4FC',

        darkHeader:'#16114e',
        darkMain:'#28235B',
        darkContainer:'#28235B',
        darkText:'#E6DCE6',
        darkIcon : '#FCFBFA',
        darkIconFocus: '#0EA5E9',
        darkFooter:'#0284C7',
      },
    },
  },
  plugins: [],
}

