module.exports = {
    content: ["./src/**/*.{js,jsx,ts,tsx}", "./index.html"],
    theme: {
        extend: {
            colors: {
                bg: "#0f1117",
                surface: "#1a1d27",
                "surface-hover": "#1f2335",
                border: "#2a2d3a",
                accent: "#7c6ff7",
                "accent-hover": "#6a5ee6",
                "text-base": "#e8e9ed",
                muted: "#8b8fa8",
            },
            fontFamily: {
                sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
            },
        },
    },
    plugins: [],
};
