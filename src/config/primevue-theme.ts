/**
 * Preset de tema para PrimeVue.
 *
 * PrimeVue 4 usa design tokens en vez de clases de CSS: el color
 * "primary", por ejemplo, es un token con 10 tonos (50, 100, …, 950)
 * que los componentes consumen internamente. Para personalizar el
 * look & feel de toda la UI alcanza con definir esos tonos una vez,
 * aquí, y pasarlos como preset al plugin en `main.ts`.
 *
 * Partimos del preset oficial `Aura` (estética moderna, espaciados
 * generosos) y sobrescribimos solamente la escala `primary` con
 * nuestros tonos de navy y el `highlight` (color usado en selección
 * de filas, focus, etc.) con el dorado semitransparente.
 *
 * Los tonos de navy se generaron manualmente para conservar
 * contraste legible en cada paso:
 *   - 50-200  → fondos suaves, bordes hover.
 *   - 500-700 → botones primarios, enlaces.
 *   - 800-950 → textos sobre fondos claros (si algún día se usan).
 */

import { definePreset } from '@primevue/themes'
import Aura from '@primevue/themes/aura'

export const navyGoldPreset = definePreset(Aura, {
  semantic: {
    primary: {
      50: '#e6ebf2',
      100: '#c0cddd',
      200: '#8fa3bd',
      300: '#5e7a9d',
      400: '#305080',
      500: '#143a5f',
      600: '#0a2540',
      700: '#081d33',
      800: '#061726',
      900: '#03101c',
      950: '#020a12',
    },
    colorScheme: {
      light: {
        // Mapeo explícito del color "primario" según estado.
        primary: {
          color: '#0a2540',
          inverseColor: '#ffffff',
          hoverColor: '#143a5f',
          activeColor: '#081d33',
        },
        // `highlight` controla resaltados (fila seleccionada, items
        // enfocados en dropdowns, etc.). Lo pintamos dorado suave
        // para que combine con el acento global.
        highlight: {
          background: 'rgba(201, 169, 97, 0.18)',
          focusBackground: 'rgba(201, 169, 97, 0.28)',
          color: '#0a2540',
          focusColor: '#0a2540',
        },
      },
    },
  },
})
