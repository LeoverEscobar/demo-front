/**
 * Forma estándar del cuerpo de error que devuelve el API.
 *
 * El backend Symfony responde con este shape ante 422 (validación)
 * y también en otros códigos de error. Lo usamos en las vistas para
 * extraer un mensaje legible cuando una petición falla:
 *
 * ```ts
 * if (err instanceof AxiosError && err.response?.status === 422) {
 *   const data = err.response.data as ApiValidationError | undefined
 *   formError.value = data?.message ?? 'Datos inválidos.'
 * }
 * ```
 *
 * - `code`: opcional, identificador interno del error (p. ej. `"validation_error"`).
 * - `message`: descripción legible.
 * - `errors`: opcional, errores por campo (`{ email: ['formato inválido'] }`).
 */
export interface ApiValidationError {
  code?: string
  message: string
  errors?: Record<string, string[]>
}
