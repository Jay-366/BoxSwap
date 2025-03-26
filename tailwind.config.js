/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#9945FF', // Solana purple
          dark: '#7B3FE4',
          light: '#B980FF',
        },
        secondary: {
          DEFAULT: '#14F195', // Solana green
          dark: '#0AC67F',
          light: '#5BFFC2',
        },
        solana: {
          purple: '#9945FF',
          green: '#14F195',
          blue: '#03E1FF',
          magenta: '#DC1FFF',
        },
        background: {
          DEFAULT: '#121212',
          light: '#1E1E1E',
        },
        card: {
          DEFAULT: '#1E1E1E',
          dark: '#161616',
          light: '#2A2A2A',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
      },
      boxShadow: {
        card: '0 4px 20px 0 rgba(0, 0, 0, 0.1)',
        'card-hover': '0 10px 30px 0 rgba(0, 0, 0, 0.2)',
      },
    },
  },
  plugins: [],
}

