import { definePreset } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';

/**
 * HMS brand emerald used by primary + success components.
 */
export const hmsAuraPreset = definePreset(Aura, {
  primitive: {
    green: {
      50: '#ecfdf5',
      100: '#d1fae5',
      200: '#a7f3d0',
      300: '#6ee7b7',
      400: '#34d399',
      500: '#10b981',
      600: '#065f46',
      700: '#064e3b',
      800: '#053c2d',
      900: '#022c22',
      950: '#011f18',
    },
  },
  semantic: {
    primary: {
      50: '{emerald.100}',
      100: '{emerald.200}',
      200: '{emerald.300}',
      300: '{emerald.500}',
      400: '{emerald.600}',
      500: '{emerald.700}',
      600: '{emerald.800}',
      700: '{emerald.900}',
      800: '{emerald.950}',
      900: '{emerald.950}',
      950: '#011f18',
    },
  },
});
