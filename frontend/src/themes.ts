export interface ThemeConfig {
  id: string;
  name: string;
  description: string;
  mermaid: {
    theme: 'base' | 'default' | 'dark' | 'forest' | 'neutral';
    themeVariables: Record<string, any>;
  };
  cssVars: Record<string, string>;
}

export const THEMES: Record<string, ThemeConfig> = {
  educational: {
    id: 'educational',
    name: 'Educacional',
    description: 'Cores suaves e didáticas com alto contraste para aulas e apostilas',
    mermaid: {
      theme: 'base',
      themeVariables: {
        primaryColor: '#DBEAFE',
        primaryTextColor: '#1E3A8A',
        primaryBorderColor: '#3B82F6',
        lineColor: '#64748B',
        secondaryColor: '#F3E8FF',
        secondaryTextColor: '#581C87',
        secondaryBorderColor: '#A855F7',
        tertiaryColor: '#FEF3C7',
        tertiaryTextColor: '#78350F',
        tertiaryBorderColor: '#F59E0B',
        noteBkgColor: '#FEF9C3',
        noteTextColor: '#854D0E',
        noteBorderColor: '#FACC15',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        fontSize: '15px'
      }
    },
    cssVars: {
      '--bg-body': '#F8FAFC',
      '--bg-card': '#FFFFFF',
      '--bg-header': '#FFFFFF',
      '--border-color': '#E2E8F0',
      '--text-main': '#0F172A',
      '--text-muted': '#64748B',
      '--accent-color': '#2563EB',
      '--accent-hover': '#1D4ED8',
      '--accent-light': '#EFF6FF',
      '--card-shadow': '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05)'
    }
  },
  corporate: {
    id: 'corporate',
    name: 'Corporativo',
    description: 'Paleta sóbria em azul marinho e cinza para relatórios executivos',
    mermaid: {
      theme: 'base',
      themeVariables: {
        primaryColor: '#E0F2FE',
        primaryTextColor: '#0369A1',
        primaryBorderColor: '#0284C7',
        lineColor: '#475569',
        secondaryColor: '#F1F5F9',
        secondaryTextColor: '#334155',
        secondaryBorderColor: '#94A3B8',
        tertiaryColor: '#ECFDF5',
        tertiaryTextColor: '#065F46',
        tertiaryBorderColor: '#10B981',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        fontSize: '15px'
      }
    },
    cssVars: {
      '--bg-body': '#F1F5F9',
      '--bg-card': '#FFFFFF',
      '--bg-header': '#0F172A',
      '--border-color': '#CBD5E1',
      '--text-main': '#0F172A',
      '--text-muted': '#475569',
      '--accent-color': '#0284C7',
      '--accent-hover': '#0369A1',
      '--accent-light': '#F0F9FF',
      '--card-shadow': '0 4px 6px -1px rgba(15, 23, 42, 0.08)'
    }
  },
  minimal: {
    id: 'minimal',
    name: 'Minimalista',
    description: 'Preto e branco refinado com foco exclusivo no conteúdo',
    mermaid: {
      theme: 'base',
      themeVariables: {
        primaryColor: '#F4F4F5',
        primaryTextColor: '#18181B',
        primaryBorderColor: '#71717A',
        lineColor: '#52525B',
        secondaryColor: '#FAFAFA',
        secondaryTextColor: '#27272A',
        secondaryBorderColor: '#A1A1AA',
        tertiaryColor: '#FFFFFF',
        tertiaryTextColor: '#18181B',
        tertiaryBorderColor: '#D4D4D8',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        fontSize: '15px'
      }
    },
    cssVars: {
      '--bg-body': '#FAFAFA',
      '--bg-card': '#FFFFFF',
      '--bg-header': '#FFFFFF',
      '--border-color': '#E4E4E7',
      '--text-main': '#18181B',
      '--text-muted': '#71717A',
      '--accent-color': '#18181B',
      '--accent-hover': '#27272A',
      '--accent-light': '#F4F4F5',
      '--card-shadow': '0 1px 3px 0 rgba(0, 0, 0, 0.05)'
    }
  },
  dark: {
    id: 'dark',
    name: 'Dark Mode',
    description: 'Fundo escuro profundo com acentos de alto contraste',
    mermaid: {
      theme: 'dark',
      themeVariables: {
        darkMode: true,
        background: '#0B0F17',
        primaryColor: '#1E293B',
        primaryTextColor: '#F8FAFC',
        primaryBorderColor: '#38BDF8',
        lineColor: '#94A3B8',
        secondaryColor: '#334155',
        secondaryTextColor: '#F1F5F9',
        secondaryBorderColor: '#818CF8',
        tertiaryColor: '#0F172A',
        tertiaryTextColor: '#E2E8F0',
        tertiaryBorderColor: '#34D399',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        fontSize: '15px'
      }
    },
    cssVars: {
      '--bg-body': '#0B0F17',
      '--bg-card': '#111827',
      '--bg-header': '#111827',
      '--border-color': '#1F2937',
      '--text-main': '#F9FAFB',
      '--text-muted': '#9CA3AF',
      '--accent-color': '#38BDF8',
      '--accent-hover': '#0EA5E9',
      '--accent-light': '#1E293B',
      '--card-shadow': '0 4px 6px -1px rgba(0, 0, 0, 0.4)'
    }
  }
};

export function applyCssTheme(themeId: string): void {
  const theme = THEMES[themeId] || THEMES.educational;
  const root = document.documentElement;
  Object.entries(theme.cssVars).forEach(([key, val]) => {
    root.style.setProperty(key, val);
  });
}
