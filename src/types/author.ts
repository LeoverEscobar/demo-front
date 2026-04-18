/**
 * DTOs de la entidad Author.
 *
 * Reflejan los esquemas `AuthorResponse`, `CreateAuthorRequest` y
 * `UpdateAuthorRequest` definidos en el OpenAPI del backend
 * (`demo-api-rest/docs/openapi.json`). Si el backend agrega o renombra
 * campos, esos cambios se propagan primero aquí, luego al service
 * correspondiente y finalmente a la vista.
 */

/**
 * Representación de un autor tal como lo devuelve el API.
 *
 * - `id` siempre presente (lo asigna el backend al crear).
 * - `biography` es opcional y puede venir como `null`.
 */
export interface AuthorResponse {
  id: number
  firstName: string
  lastName: string
  biography: string | null
}

/**
 * Cuerpo del POST `/authors` para crear un autor nuevo.
 *
 * Reglas de validación del backend (replicadas en `AuthorsView`):
 *  - `firstName`: requerido, máximo 100 caracteres.
 *  - `lastName`: requerido, máximo 100 caracteres.
 *  - `biography`: opcional, máximo 5000 caracteres.
 */
export interface CreateAuthorRequest {
  firstName: string
  lastName: string
  biography?: string | null
}

/**
 * Cuerpo del PUT `/authors/{id}`.
 *
 * El backend trata update y create con el mismo esquema, por eso lo
 * declaramos como alias. Si algún día difieren (p. ej. update parcial),
 * conviene separarlos.
 */
export type UpdateAuthorRequest = CreateAuthorRequest
