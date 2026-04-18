/**
 * DTOs de la entidad Book.
 *
 * Reflejan los esquemas `BookResponse`, `CreateBookRequest` y
 * `UpdateBookRequest` del OpenAPI. Un libro tiene relación muchos-a-muchos
 * con autores: en las respuestas llega poblado (`authors: AuthorResponse[]`)
 * pero al crear o actualizar enviamos sólo los IDs (`authorIds: number[]`).
 */

import type { AuthorResponse } from '@/types/author'

/**
 * Libro tal como lo devuelve el API.
 *
 * - `isbn`, `publicationYear`, `synopsis` son opcionales y pueden ser `null`.
 * - `authors` viene embebido: el backend hace el JOIN y devuelve el
 *   objeto completo de cada autor asociado.
 */
export interface BookResponse {
  id: number
  title: string
  isbn: string | null
  publicationYear: number | null
  synopsis: string | null
  authors: AuthorResponse[]
}

/**
 * Cuerpo del POST `/books`.
 *
 * Reglas del backend (replicadas en `BooksView`):
 *  - `title`: requerido, máximo 200 caracteres.
 *  - `isbn`: opcional, máximo 20 caracteres.
 *  - `publicationYear`: opcional, entre 1450 y 2100.
 *  - `synopsis`: opcional, máximo 10000 caracteres.
 *  - `authorIds`: array de IDs de autores existentes, al menos uno.
 *    El backend valida que cada ID exista antes de persistir.
 */
export interface CreateBookRequest {
  title: string
  isbn?: string | null
  publicationYear?: number | null
  synopsis?: string | null
  authorIds: number[]
}

/**
 * Cuerpo del PUT `/books/{id}`.
 *
 * En update, el array `authorIds` reemplaza completamente la relación:
 * lo que no venga en el array se desasocia.
 */
export type UpdateBookRequest = CreateBookRequest
