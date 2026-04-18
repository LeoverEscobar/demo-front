/**
 * Cliente HTTP central de la aplicación.
 *
 * Toda petición al API pasa por este módulo. Los `services/` lo usan
 * para que los componentes nunca hablen con axios directamente: así
 * podemos cambiar de librería HTTP (fetch, ky, etc.) tocando sólo
 * este archivo.
 *
 * Responsabilidades:
 *  - Crear una única instancia de axios con la URL base del API.
 *  - Inyectar el token JWT en cada request (interceptor de request).
 *  - Detectar respuestas 401 (no autorizado) y notificar al store de
 *    autenticación para que cierre la sesión (interceptor de response).
 *
 * El token y el handler de 401 se inyectan desde `main.ts` vía
 * `configureHttpClient(...)` para evitar una dependencia circular
 * entre el cliente HTTP y el store de Pinia.
 */

import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios'

/**
 * URL base de todas las peticiones.
 *
 * Se lee de la variable de entorno `VITE_API_BASE_URL` (definida en
 * `.env`). Si no existe, se usa `/api/v1` como fallback, lo que
 * permite que el proxy de Vite en desarrollo enrute hacia el backend
 * Symfony sin problemas de CORS.
 */
const baseURL = import.meta.env.VITE_API_BASE_URL || '/api/v1'

/**
 * Instancia de axios que exporta este módulo.
 *
 * Todos los servicios deben importar este `apiClient` en lugar de
 * importar `axios` directamente — así se benefician automáticamente
 * de los interceptores configurados abajo.
 */
export const apiClient = axios.create({
  baseURL,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
})

/** Función que se ejecuta cuando el API responde 401. */
type UnauthorizedHandler = () => void

// Estos dos callbacks se inyectan desde `main.ts`. Quedan como
// variables de módulo para que los interceptores (definidos más
// abajo) puedan leerlos en cada petición sin depender del store.
let onUnauthorized: UnauthorizedHandler | null = null
let tokenProvider: (() => string | null) | null = null

/**
 * Conecta el cliente HTTP con el store de autenticación.
 *
 * Debe llamarse una sola vez, en `main.ts`, después de crear Pinia
 * y antes de montar la app. Se hace así (y no importando el store
 * directamente) para evitar que este archivo dependa de Pinia y
 * generar una dependencia circular.
 *
 * @param options.getToken función que devuelve el JWT vigente o `null`.
 * @param options.onUnauthorized callback a invocar cuando el API
 *   responde 401 (típicamente: cerrar sesión y redirigir al login).
 */
export function configureHttpClient(options: {
  getToken: () => string | null
  onUnauthorized: UnauthorizedHandler
}) {
  tokenProvider = options.getToken
  onUnauthorized = options.onUnauthorized
}

/**
 * Interceptor de REQUEST: agrega el header `Authorization: Bearer <token>`
 * si hay una sesión activa. Se ejecuta antes de cada petición saliente.
 */
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = tokenProvider?.()
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`)
  }
  return config
})

/**
 * Interceptor de RESPONSE: si el API devuelve 401 (token expirado o
 * inválido), dispara el handler registrado — el store de auth se
 * encarga de limpiar la sesión y redirigir al login.
 *
 * Siempre re-lanza el error con `Promise.reject` para que el código
 * que hizo la llamada pueda mostrar su propio mensaje de error.
 */
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      onUnauthorized?.()
    }
    return Promise.reject(error)
  },
)
