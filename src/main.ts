/**
 * Punto de entrada de la aplicación.
 *
 * Se encarga de:
 *  1. Crear la instancia de Vue y la de Pinia.
 *  2. Rehidratar la sesión desde `sessionStorage` antes de que el router
 *     ejecute su primer guard (si no, el usuario siempre vería el login
 *     al recargar, aunque tuviera sesión activa).
 *  3. Conectar el cliente HTTP con el store de auth (inyección de
 *     dependencias vía `configureHttpClient` — así `http/client.ts` no
 *     necesita importar Pinia y evitamos dependencia circular).
 *  4. Registrar los plugins globales: PrimeVue con el preset navy+gold,
 *     ConfirmationService (para `useConfirm`) y ToastService (para `useToast`).
 *  5. Importar las hojas de estilo globales antes de montar.
 *
 * El orden de los `app.use` importa: Pinia debe ir primero para que el
 * `useAuthStore()` que ejecutamos justo después funcione; PrimeVue y
 * sus servicios pueden ir después del router sin problemas.
 */

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import PrimeVue from 'primevue/config'
import ConfirmationService from 'primevue/confirmationservice'
import ToastService from 'primevue/toastservice'

// Estilos globales. Primero los íconos de PrimeVue y luego nuestro
// CSS de variables para que nuestras reglas puedan sobrescribir las
// por defecto de PrimeVue cuando haga falta.
import 'primeicons/primeicons.css'
import '@/assets/styles/main.css'

import App from './App.vue'
import router from './router'
import { navyGoldPreset } from '@/config/primevue-theme'
import { configureHttpClient } from '@/http/client'
import { useAuthStore } from '@/stores/auth'

const app = createApp(App)
const pinia = createPinia()

// 1) Pinia antes que cualquier uso de store.
app.use(pinia)

// 2) Rehidratar la sesión antes de instalar el router: así, cuando el
//    guard global se ejecute en la primera navegación, ya verá el
//    valor correcto de `isAuthenticated`.
const auth = useAuthStore()
auth.hydrate()

// 3) Inyectar dependencias al cliente HTTP.
//    - `getToken` se lee en cada request (closure sobre el store).
//    - `onUnauthorized` se ejecuta si el API responde 401.
configureHttpClient({
  getToken: () => auth.token,
  onUnauthorized: () => {
    auth.logout()
    if (router.currentRoute.value.name !== 'login') {
      void router.push({ name: 'login' })
    }
  },
})

// 4) Router + PrimeVue + servicios.
app.use(router)
app.use(PrimeVue, {
  theme: {
    preset: navyGoldPreset,
    // Forzamos modo light pasando un selector que nunca matchea:
    // PrimeVue cambia a dark si el selector existe en el DOM.
    options: {
      darkModeSelector: '.never-dark',
    },
  },
  ripple: true,
})
app.use(ConfirmationService)
app.use(ToastService)

app.mount('#app')
