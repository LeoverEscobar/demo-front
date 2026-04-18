/**
 * Tipos para el manejo de paginación.
 *
 * El API envuelve todas las listas en un objeto `{ data, page }`, así que
 * los services devuelven `PaginatedResponse<T>` y las vistas leen
 * `result.data` para la tabla y `result.page.totalItems` para el paginador.
 */

/**
 * Metadatos de paginación tal como los devuelve el API.
 *
 * - `number`: número de página actual (1-indexada).
 * - `size`: cantidad de elementos por página.
 * - `totalItems`: total de registros en la colección.
 * - `totalPages`: total de páginas dado el `size` actual.
 */
export interface PageMeta {
  number: number
  size: number
  totalItems: number
  totalPages: number
}

/**
 * Envoltura genérica para listados paginados.
 *
 * El tipo `T` es la entidad individual: `PaginatedResponse<AuthorResponse>`,
 * `PaginatedResponse<BookResponse>`, etc.
 */
export interface PaginatedResponse<T> {
  data: T[]
  page: PageMeta
}

/**
 * Query params que acepta el API en los endpoints de listado.
 *
 * Todos los services exponen `list(page, size)`, así que rara vez
 * se usa este tipo directamente — está aquí por si un caso avanzado
 * necesita construir el objeto de params dinámicamente.
 */
export interface PageQuery {
  page?: number
  size?: number
}
