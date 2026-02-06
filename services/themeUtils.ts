
import { CSSProperties } from 'react';

// Preset Colors Map (Tailwind 500 values)
export const PRESET_COLORS: Record<string, string> = {
    emerald: '#10b981',
    blue: '#3b82f6',
    violet: '#8b5cf6',
    rose: '#f43f5e',
    amber: '#f59e0b',
    cyan: '#06b6d4',
};

// Helper to adjust brightness of a hex color
// Amount: -1.0 (black) to 1.0 (white)
const adjustBrightness = (hex: string, amount: number): string => {
    let usePound = false;
    if (hex[0] === "#") {
        hex = hex.slice(1);
        usePound = true;
    }
    const num = parseInt(hex, 16);
    let r = (num >> 16) + amount * 255;
    let g = ((num >> 8) & 0x00FF) + amount * 255;
    let b = (num & 0x0000FF) + amount * 255;

    r = Math.min(255, Math.max(0, r));
    g = Math.min(255, Math.max(0, g));
    b = Math.min(255, Math.max(0, b));

    return (usePound ? "#" : "") + ((1 << 24) + (Math.round(r) << 16) + (Math.round(g) << 8) + Math.round(b)).toString(16).slice(1);
};

// Generate a Tailwind-like palette (50-950) from a single base color (approximate 500 shade)
export const generatePalette = (baseColor: string) => {
    // If it's a preset name, get the hex
    const hex = PRESET_COLORS[baseColor] || baseColor;

    return {
        50: adjustBrightness(hex, 0.9),
        100: adjustBrightness(hex, 0.8),
        200: adjustBrightness(hex, 0.6),
        300: adjustBrightness(hex, 0.4),
        400: adjustBrightness(hex, 0.2),
        500: hex, // Base
        600: adjustBrightness(hex, -0.1),
        700: adjustBrightness(hex, -0.2),
        800: adjustBrightness(hex, -0.3),
        900: adjustBrightness(hex, -0.4),
        950: adjustBrightness(hex, -0.5),
    };
};

// Returns CSS variables style object to inject into the root
export const getThemeVariables = (color: string): CSSProperties => {
    const palette = generatePalette(color);
    const vars: any = {};
    
    Object.entries(palette).forEach(([shade, value]) => {
        vars[`--primary-${shade}`] = value;
    });

    return vars as CSSProperties;
};
