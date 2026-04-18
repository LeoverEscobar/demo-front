/**
 * Declaraciones de tipos globales.
 *
 *  - `/// <reference types="vite/client" />` habilita los tipos de
 *    `import.meta.env` (las variables `VITE_*` tipadas como string).
 *
 *  - El `declare module '*.vue'` es un "shim" que le dice a
 *    TypeScript cómo tratar los archivos `.vue` cuando se importan.
 *    Sin este bloque, `vue-tsc 3.x` reporta errores TS2307
 *    ("Cannot find module './App.vue'") en cada import.
 */

/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<object, object, unknown>
  export default component
}
