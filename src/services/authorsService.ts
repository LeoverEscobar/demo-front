/**
 * Servicio de Autores.
 *
 * Expone las cinco operaciones estándar de un CRUD REST contra
 * `/api/v1/authors`. Sirve como plantilla: cualquier entidad nueva
 * debe seguir esta misma forma (`list`, `get`, `create`, `update`,
 * `remove`) para que los componentes sean intercambiables.
 */

import { apiClient } from '@/http/client'
import type { AuthorResponse, CreateAuthorRequest, UpdateAuthorRequest } from '@/types/author'
import type { PaginatedResponse } from '@/types/pagination'

export const authorsService = {
  /**
   * Trae una página de autores desde el API.
   *
   * @param page número de página (1-indexada). Default: 1.
   * @param size cantidad de elementos por página (máx 100). Default: 20.
   * @returns objeto `{ data, page }` con el listado y los metadatos.
   */
  async list(page = 1, size = 20): Promise<PaginatedResponse<AuthorResponse>> {
    const { data } = await apiClient.get<PaginatedResponse<AuthorResponse>>('/authors', {
      params: { page, size },
    })
    return data
  },

  /** Obtiene un autor por id. Propaga 404 si no existe. */
  async get(id: number): Promise<AuthorResponse> {
    const { data } = await apiClient.get<AuthorResponse>(`/authors/${id}`)
    return data
  },

  /** Crea un autor nuevo. Propaga 422 si la validación falla. */
  async create(payload: CreateAuthorRequest): Promise<AuthorResponse> {
    const { data } = await apiClient.post<AuthorResponse>('/authors', payload)
    return data
  },

  /** Actualiza un autor existente. Propaga 404 o 422 según el caso. */
  async update(id: number, payload: UpdateAuthorRequest): Promise<AuthorResponse> {
    const { data } = await apiClient.put<AuthorResponse>(`/authors/${id}`, payload)
    return data
  },

  /**
   * Elimina un autor. El API responde 204 sin cuerpo, por eso no
   * hay `return` aquí — la vista sabe que terminó si no lanzó error.
   */
  async remove(id: number): Promise<void> {
    await apiClient.delete(`/authors/${id}`)
  },
}
