/**
 * Servicio de Libros.
 *
 * Misma forma que `authorsService` — es la regla del proyecto: todo
 * CRUD expone `list`, `get`, `create`, `update`, `remove` con firmas
 * equivalentes. Esto permite que el patrón de vista (DataTable +
 * Dialog + ConfirmDialog) funcione sin cambios al copiarlo.
 *
 * La relación libro ↔ autor se envía como `authorIds: number[]` en
 * los requests de create/update; en la respuesta llega embebida como
 * `authors: AuthorResponse[]`.
 */

import { apiClient } from '@/http/client'
import type { BookResponse, CreateBookRequest, UpdateBookRequest } from '@/types/book'
import type { PaginatedResponse } from '@/types/pagination'

export const booksService = {
  /** Lista paginada de libros. Ver `authorsService.list` para el detalle de params. */
  async list(page = 1, size = 20): Promise<PaginatedResponse<BookResponse>> {
    const { data } = await apiClient.get<PaginatedResponse<BookResponse>>('/books', {
      params: { page, size },
    })
    return data
  },

  /** Obtiene un libro por id con sus autores embebidos. */
  async get(id: number): Promise<BookResponse> {
    const { data } = await apiClient.get<BookResponse>(`/books/${id}`)
    return data
  },

  /**
   * Crea un libro nuevo.
   *
   * El backend valida que todos los IDs en `authorIds` existan antes
   * de persistir; si alguno no existe responde 422 y el libro no se crea.
   */
  async create(payload: CreateBookRequest): Promise<BookResponse> {
    const { data } = await apiClient.post<BookResponse>('/books', payload)
    return data
  },

  /**
   * Actualiza un libro existente.
   *
   * `authorIds` reemplaza por completo la relación actual: lo que no
   * venga en el nuevo array se desasocia.
   */
  async update(id: number, payload: UpdateBookRequest): Promise<BookResponse> {
    const { data } = await apiClient.put<BookResponse>(`/books/${id}`, payload)
    return data
  },

  /** Elimina un libro. El API responde 204 sin cuerpo. */
  async remove(id: number): Promise<void> {
    await apiClient.delete(`/books/${id}`)
  },
}
