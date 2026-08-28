// src/theme/mantineTheme.ts
import { createTheme, rem } from '@mantine/core';

export const theme = createTheme({
  // Tipografía
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  fontFamilyMonospace: "'JetBrains Mono', 'Fira Code', monospace",
  fontSizes: {
    xs: rem(11),
    sm: rem(12),
    md: rem(14),
    lg: rem(16),
    xl: rem(18),
  },
  headings: {
    fontFamily: "'Inter', sans-serif",
    fontWeight: '600',
    sizes: {
      h1: { fontSize: rem(28) },
      h2: { fontSize: rem(22) },
      h3: { fontSize: rem(18) },
      h4: { fontSize: rem(16) },
      h5: { fontSize: rem(14) },
    },
  },

  // Paleta de colores — mapeada al sistema Mantine
  primaryColor: 'cityBlue',
  colors: {
    cityBlue: [
      '#EBF3FC', // 0 - fondo muy claro
      '#D0E4F5', // 1
      '#A8CCE9', // 2
      '#8FB8D8', // 3 - azul secundario
      '#6EA0C8', // 4
      '#4A88B8', // 5
      '#2563A6', // 6 - primario
      '#1E519A', // 7
      '#173E82', // 8
      '#142430', // 9 - sidebar
    ],
    cityGreen: [
      '#EAF4EF',
      '#D0E8DC',
      '#A8D1BF',
      '#7FBEA6',
      '#65AB90',
      '#4F8A72', // 5 - verde principal
      '#3D7060',
      '#2D564A',
      '#1E3C33',
      '#0F211B',
    ],
    cityOrange: [
      '#FDF5E6',
      '#FAE8C3',
      '#F5D299',
      '#F0BB6B',
      '#E8A443',
      '#D99838', // 5 - naranja principal
      '#C07B1E',
      '#9A5F10',
      '#754507',
      '#4F2D02',
    ],
    cityRed: [
      '#FDEEF0',
      '#FADDE1',
      '#F3B2BA',
      '#EC8492',
      '#E25D6E',
      '#C83E4D', // 5 - rojo principal
      '#A8303D',
      '#8A2231',
      '#6B1625',
      '#4C0C19',
    ],
    citySurface: [
      '#FFFFFF',
      '#F7F8FA', // fondo principal
      '#F2F0EC',
      '#EBE6DE', // superficie cálida
      '#E0D9CF',
      '#D4CCC0',
      '#BFB5A5',
      '#A09180',
      '#7D6E5C',
      '#5A4D3E',
    ],
  },

  // Radios
  radius: {
    xs: rem(4),
    sm: rem(6),
    md: rem(8),
    lg: rem(12),
    xl: rem(16),
  },

  // Sombras discretas
  shadows: {
    xs: '0 1px 3px rgba(0,0,0,0.05)',
    sm: '0 2px 6px rgba(0,0,0,0.06)',
    md: '0 4px 12px rgba(0,0,0,0.08)',
    lg: '0 8px 24px rgba(0,0,0,0.10)',
    xl: '0 16px 40px rgba(0,0,0,0.12)',
  },

  // Defaults de componentes
  components: {
    Card: {
      defaultProps: {
        radius: 'md',
        shadow: 'sm',
        withBorder: false,
      },
    },
    Badge: {
      defaultProps: {
        radius: 'sm',
      },
    },
    Button: {
      defaultProps: {
        radius: 'sm',
      },
    },
    Select: {
      defaultProps: {
        radius: 'sm',
      },
    },
    TextInput: {
      defaultProps: {
        radius: 'sm',
      },
    },
    Table: {
      defaultProps: {
        striped: false,
        highlightOnHover: true,
        withTableBorder: false,
        withColumnBorders: false,
      },
    },
  },

  // Espaciado base
  spacing: {
    xs: rem(4),
    sm: rem(8),
    md: rem(16),
    lg: rem(24),
    xl: rem(32),
  },

  other: {
    // Design tokens accesibles desde el tema
    sidebarWidth: '240px',
    headerHeight: '64px',
    sidebarBg: '#142430',
    sidebarActive: '#2563A6',
    mainBg: '#F7F8FA',
    cardBg: '#FFFFFF',
    borderColor: '#E8EBF0',
    textPrimary: '#1A2332',
    textSecondary: '#6B7480',
    textMuted: '#9BA3AE',
    success: '#4F8A72',
    warning: '#D99838',
    danger: '#C83E4D',
    info: '#2563A6',
    infoLight: '#8FB8D8',
    surface: '#EBE6DE',
  },
});
