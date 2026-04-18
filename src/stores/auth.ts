/**
 * Store de autenticación (Pinia).
 *
 * Mantiene en memoria el token JWT, la fecha de expiración y el email
 * del usuario. Persiste la sesión en `sessionStorage` para que al
 * refrescar la página el usuario siga logueado (hasta que cierre la
 * pestaña o expire el token).
 *
 * Elegimos `sessionStorage` sobre `localStorage`:
 *  - Se limpia al cerrar la pestaña → más seguro ante descuidos.
 *  - Aísla sesiones entre pestañas (cada una tiene su propio storage).
 *
 * Usa el *setup store pattern* de Pinia 2+ (función que devuelve state
 * y acciones) en lugar del antiguo options store: es más similar a la
 * Composition API de Vue y permite computeds nativos.
 */

import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { AuthSession, LoginResponse } from '@/types/auth'

/** Clave única bajo la que guardamos la sesión en `sessionStorage`. */
const STORAGE_KEY = 'demo-front:auth'

/**
 * Lee la sesión persistida desde `sessionStorage`.
 *
 * Devuelve `null` si:
 *  - No existe la clave.
 *  - El JSON está corrupto.
 *  - Le faltan campos obligatorios.
 *
 * Los callers deben validar además si `expiresAt` ya pasó.
 */
function readSession(): AuthSession | null {
  const raw = sessionStorage.getItem(STORAGE_KEY)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as AuthSession
    if (!parsed.token || !parsed.expiresAt) return null
    return parsed
  } catch {
    return null
  }
}

export const useAuthStore = defineStore('auth', () => {
  // --- Estado reactivo ---------------------------------------------------
  const token = ref<string | null>(null)
  const expiresAt = ref<number | null>(null)
  const email = ref<string | null>(null)

  // --- Getters (computeds) ----------------------------------------------

  /**
   * `true` si hay un token y todavía no expiró.
   *
   * Úsalo en el router guard y en componentes que necesiten saber si
   * el usuario está logueado. Es un `computed`, así que se recalcula
   * automáticamente cuando cambian `token` o `expiresAt`.
   */
  const isAuthenticated = computed(() => {
    if (!token.value || !expiresAt.value) return false
    return expiresAt.value > Date.now()
  })

  /**
   * Primera letra del email en mayúsculas, para el avatar del topbar.
   * Si no hay email, devuelve `"?"`.
   */
  const userInitial = computed(() => (email.value ? email.value.charAt(0).toUpperCase() : '?'))

  // --- Acciones ---------------------------------------------------------

  /**
   * Rehidrata el estado leyendo `sessionStorage`.
   *
   * Se llama una sola vez en `main.ts`, antes de montar la app, para
   * que el guard del router vea la sesión en la primera navegación.
   * Si la sesión está expirada o corrupta, la borra del storage.
   */
  function hydrate() {
    const session = readSession()
    if (!session || session.expiresAt <= Date.now()) {
      sessionStorage.removeItem(STORAGE_KEY)
      return
    }
    token.value = session.token
    expiresAt.value = session.expiresAt
    email.value = session.email
  }

  /**
   * Guarda una sesión nueva en memoria y en `sessionStorage`.
   *
   * Se invoca desde `LoginView` después de que `authService.login(...)`
   * responde con éxito.
   *
   * @param response respuesta del API (`token`, `tokenType`, `expiresIn`).
   * @param userEmail email del usuario que acaba de autenticarse
   *   (el API no lo devuelve, pero lo necesitamos para mostrarlo en UI).
   */
  function login(response: LoginResponse, userEmail: string) {
    const session: AuthSession = {
      token: response.token,
      expiresAt: Date.now() + response.expiresIn * 1000,
      email: userEmail,
    }
    token.value = session.token
    expiresAt.value = session.expiresAt
    email.value = session.email
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session))
  }

  /**
   * Limpia estado y `sessionStorage`.
   *
   * Lo dispara el usuario desde el menú del topbar, o automáticamente
   * el interceptor de axios al recibir un 401.
   */
  function logout() {
    token.value = null
    expiresAt.value = null
    email.value = null
    sessionStorage.removeItem(STORAGE_KEY)
  }

  return { token, expiresAt, email, isAuthenticated, userInitial, hydrate, login, logout }
})
