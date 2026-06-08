import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        dyoli: {
          pink: '#D98BAA',
          rose: '#F6D6E2',
          soft: '#FFF5F9',
          black: '#171317',
          wine: '#8D4666',
        },
      },
      borderRadius: {
        dyoli: '28px',
      },
    },
  },
  plugins: [],
}

export default config
