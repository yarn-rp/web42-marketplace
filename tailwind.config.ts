import type { Config } from "tailwindcss"

const { fontFamily } = require("tailwindcss/defaultTheme")

const config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
  	container: {
  		center: true,
  		padding: '2rem',
  		screens: {
  			'2xl': '1400px'
  		}
  	},
  	extend: {
  		fontFamily: {
  			sans: [
  				'var(--font-sans)',
                    ...fontFamily.sans
                ],
  			mono: [
  				'var(--font-mono)',
                    ...fontFamily.mono
                ],
  			pixel: [
  				'var(--font-pixel)',
  				'monospace'
  			]
  		},
  		colors: {
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			base: {
  				'25': '#FAFAFA',
  				'50': '#F5F5F5',
  				'100': '#EAEAEA',
  				'150': '#D0D0D0',
  				'200': '#B6B6B6',
  				'300': '#9C9C9C',
  				'500': '#727272',
  				'600': '#5E5E5E',
  				'700': '#4A4A4A',
  				'800': '#363636',
  				'850': '#2D2D2D',
  				'900': '#242424',
  				'950': '#1B1B1B',
  				'975': '#121212',
  				black: '#0A0A0A',
  				paper: '#FFFFFF'
  			},
  			gray: {
  				'25': '#fbfbfb',
  				'50': '#f6f6f6',
  				'100': '#e7e7e7',
  				'200': '#d1d1d1',
  				'300': '#b0b0b0',
  				'400': '#999999',
  				'500': '#6d6d6d',
  				'600': '#5d5d5d',
  				'700': '#4f4f4f',
  				'800': '#454545',
  				'900': '#3d3d3d',
  				'950': '#262626',
  				'975': '#1e1e1e'
  			}
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		keyframes: {
  			'accordion-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: '0'
  				}
  			},
		float: {
				'0%, 100%': {
					transform: 'translateY(0)'
				},
				'50%': {
					transform: 'translateY(-8px)'
				}
			}
		},
		animation: {
			'accordion-down': 'accordion-down 0.2s ease-out',
			'accordion-up': 'accordion-up 0.2s ease-out',
			float: 'float 3s ease-in-out infinite'
		}
  	}
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
} satisfies Config

export default config
