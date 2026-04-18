/**
 * Tipos relacionados con la autenticación.
 *
 * Estos tipos describen los JSON que viajan entre el cliente y el
 * endpoint `/api/v1/auth/login` del API. Están escritos a mano a
 * partir del esquema OpenAPI del backend Symfony: cuando el API
 * cambie, estos tipos deben actualizarse aquí antes de tocar
 * services o componentes.
 */

/**
 * Cuerpo del POST `/auth/login`.
 *
 * El backend valida `minLength: 6` en la contraseña; el frontend
 * replica esa validación en `LoginView` para dar feedback inmediato.
 */
export interface LoginRequest {
  email: string
  password: string
}

/**
 * Respuesta exitosa del POST `/auth/login`.
 *
 * - `token`: JWT firmado por el backend. Se envía como
 *   `Authorization: Bearer <token>` en las siguientes peticiones.
 * - `tokenType`: siempre `"Bearer"`; lo devuelve el API por
 *   consistencia con RFC 6750.
 * - `expiresIn`: segundos de vida del token desde su emisión
 *   (por defecto 3600 = 1 hora).
 */
export interface LoginResponse {
  token: string
  tokenType: string
  expiresIn: number
}

/**
 * Forma persistida en `sessionStorage` por el store de autenticación.
 *
 * No es parte del API: es nuestro formato interno para poder rehidratar
 * la sesión al recargar la página. Se calcula a partir de `LoginResponse`:
 * `expiresAt = Date.now() + expiresIn * 1000`.
 */
export interface AuthSession {
  token: string
  expiresAt: number
  email: string
}
