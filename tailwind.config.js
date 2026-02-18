/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                // Stitch Design System Colors
                "primary": "#2480cc",
                "on-primary": "#ffffff",
                "primary-container": "#d3e4ff",
                "on-primary-container": "#001c38",
                "secondary": "#535f70",
                "surface": "#f8fafb",
                "on-surface": "#191c20",
                "surface-variant": "#e1e2e8",
                "on-surface-variant": "#43474e",
                "error": "#ba1a1a",
                "error-container": "#ffdad6",
                "on-error-container": "#410002",
                "success": "#2e7d32",
                "success-container": "#bdfcbf",
                "warning": "#ed6c02",
                "warning-container": "#ffcca5",
                "background-light": "#f6f7f8",
                "background-dark": "#121a20",

                // Legacy support (mapping to new system where possible)
                background: '#f6f7f8', // mapped to background-light
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
                display: ['Inter', 'sans-serif'],
            },
            borderRadius: {
                "DEFAULT": "0.25rem",
                "sm": "0.125rem",
                "md": "0.375rem",
                "lg": "0.5rem",
                "xl": "0.75rem",
                "2xl": "1rem",
                "3xl": "1.5rem",
            },
            boxShadow: {
                'elevation-1': '0px 1px 2px 0px rgba(0, 0, 0, 0.3), 0px 1px 3px 1px rgba(0, 0, 0, 0.15)',
                'elevation-2': '0px 1px 2px 0px rgba(0, 0, 0, 0.3), 0px 2px 6px 2px rgba(0, 0, 0, 0.15)',
                'elevation-3': '0px 4px 8px 3px rgba(0, 0, 0, 0.15), 0px 1px 3px 0px rgba(0, 0, 0, 0.3)',
            },
            animation: {
                'slide-up': 'slideUp 0.3s ease-out',
                'fade-in': 'fadeIn 0.2s ease-in',
            },
            keyframes: {
                slideUp: {
                    '0%': { transform: 'translateY(10px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                }
            }
        },
    },
    plugins: [],
}
