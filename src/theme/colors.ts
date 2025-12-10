export const colors = {
    // Backgrounds
    background: {
        primary: '#0F172A', // Deep Navy
        secondary: '#1E293B', // Slate
        glass: 'rgba(255, 255, 255, 0.1)',
        glassStrong: 'rgba(255, 255, 255, 0.15)',
        tertiary: '#334155', // Slate 700
    },

    // Text
    text: {
        primary: '#F8FAFC',
        secondary: '#94A3B8',
        accent: '#38BDF8',
    },

    // Status/Accents
    accent: {
        primary: '#38BDF8', // Sky Blue
        success: '#10B981', // Emerald
        warning: '#F59E0B', // Amber
        error: '#EF4444', // Red
    },

    // Gradients
    gradients: {
        primary: ['#38BDF8', '#818CF8'] as const,
        success: ['#10B981', '#34D399'] as const,
        accent: ['#F59E0B', '#FBBF24'] as const, // Amber/Orange
        error: ['#EF4444', '#F87171'] as const,
        glass: ['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.05)'] as const,
    }
};
