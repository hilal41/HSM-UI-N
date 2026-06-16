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
      500: '#059669',
      600: '#047857',
      700: '#064e3b',
      800: '#053c2d',
      900: '#022c22',
      950: '#011f18',
    },
  },
  semantic: {
    primary: {
      50: '{green.50}',
      100: '{green.100}',
      200: '{green.200}',
      300: '{green.300}',
      400: '{green.400}',
      500: '{green.500}',
      600: '{green.600}',
      700: '{green.700}',
      800: '{green.800}',
      900: '{green.900}',
      950: '{green.950}',
    },
  },
});
