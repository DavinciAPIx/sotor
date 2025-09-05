
import type { Config } from "tailwindcss";

export default {
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
			colors: {
        copper: {
          50: "#fdf5f1",
          100: "#fbe1d3",
          200: "#f5b899",
          500: "#b87333",
          600: "#9a5f29"
        },
        "dark-silver": {
          50: "#f5f7f9",
          100: "#e2e6ea",
          200: "#c3c9d1",
          500: "#7c8a99",
          600: "#65717f"
        },
        "dark-gold": {
          50: "#fcf8ed",
          100: "#f7eecf",
          200: "#e9d497",
          500: "#c6a436",
          600: "#a88728"
        },
        bahthali: {
          50: "#f0f9ff",
          500: "#3b82f6"
        },

				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
bahthali: {
  50:  '#f2fef6',  // أخضر فاتح جدًا (كخلفية)
  100: '#d6f9e2',
  200: '#a8f0c6',
  300: '#7de6ab',
  400: '#4fd28e',
  500: '#2aae73',  // اللون الأساسي (متوسط)
  600: '#208b5b',
  700: '#186d49',
  800: '#11533a',
  900: '#0c3c2b',
  950: '#06261b',  // أخضر داكن جدًا (للنصوص القوية أو الخلفيات العميقة)
},
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
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
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
				'fade-in': {
					'0%': {
						opacity: '0',
						transform: 'translateY(10px)'
					},
					'100%': {
						opacity: '1',
						transform: 'translateY(0)'
					}
				},
				'fade-out': {
					'0%': {
						opacity: '1',
						transform: 'translateY(0)'
					},
					'100%': {
						opacity: '0',
						transform: 'translateY(10px)'
					}
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'fade-in': 'fade-in 0.3s ease-out',
				'fade-out': 'fade-out 0.3s ease-out'
			},
			fontFamily: {
				tajawal: ['Tajawal', 'sans-serif'],
				sans: ['Tajawal', 'sans-serif'],
			},
			boxShadow: {
				'purple-glow': '0px 0px 28px rgba(168, 38, 255, 0.22)',
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
