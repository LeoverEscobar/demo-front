/**
 * Servicio de autenticación.
 *
 * Un servicio es un objeto que agrupa todas las llamadas HTTP de un
 * recurso del API. Es el único lugar donde aparece la URL del endpoint:
 * los componentes importan el servicio y llaman métodos con semántica
 * (`authService.login(...)`), nunca arman URLs ni manejan axios.
 *
 * Ventajas de este patrón:
 *  - Si el endpoint cambia de ruta, se toca un sólo archivo.
 *  - Los tipos de entrada y salida quedan explícitos en la firma.
 *  - Los componentes se enfocan en UI; la capa de datos queda aislada.
 */

import { apiClient } from '@/http/client'
import type { LoginRequest, LoginResponse } from '@/types/auth'

export const authService = {
  /**
   * Envía credenciales al API y devuelve el token JWT + metadatos.
   *
   * Errores que puede propagar (el caller los captura con try/catch):
   *  - `401`: credenciales inválidas.
   *  - `422`: validación (email inválido, contraseña muy corta).
   *
   * No persiste nada: el store de auth es quien decide qué guardar.
   */
  async login(payload: LoginRequest): Promise<LoginResponse> {
    const { data } = await apiClient.post<LoginResponse>('/auth/login', payload)
    return data
  },
}
