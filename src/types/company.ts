/**
 * DTOs de la entidad Company.
 *
 * Reflejan los esquemas `CompanyResponse`, `CreateCompanyRequest` y
 * `UpdateCompanyRequest` definidos en el OpenAPI del backend.
 */

export interface CompanyResponse {
  id: number
  nit: string
  name: string
  address: string | null
  city: string | null
  phone: string | null
  email: string | null
  legalRepresentative: string | null
  practicesContactName: string | null
  studentCapacity: number | null
  sector: string | null
  status: 'active' | 'inactive'
  deletedAt: string | null
}

export interface CreateCompanyRequest {
  nit: string
  name: string
  address?: string | null
  city?: string | null
  phone?: string | null
  email?: string | null
  legalRepresentative?: string | null
  practicesContactName?: string | null
  studentCapacity?: number | null
  sector?: string | null
  status?: 'active' | 'inactive'
}

export type UpdateCompanyRequest = CreateCompanyRequest