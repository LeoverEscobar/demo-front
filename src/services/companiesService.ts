/**
 * Servicio de Empresas.
 *
 * Expone las cinco operaciones estándar de un CRUD REST contra
 * `/api/v1/companies`.
 */

import { apiClient } from '@/http/client'
import type { CompanyResponse, CreateCompanyRequest, UpdateCompanyRequest } from '@/types/company'
import type { PaginatedResponse } from '@/types/pagination'

export const companiesService = {
  async list(page = 1, size = 20): Promise<PaginatedResponse<CompanyResponse>> {
    const { data } = await apiClient.get<PaginatedResponse<CompanyResponse>>('/companies', {
      params: { page, size },
    })
    return data
  },

  async get(id: number): Promise<CompanyResponse> {
    const { data } = await apiClient.get<CompanyResponse>(`/companies/${id}`)
    return data
  },

  async create(payload: CreateCompanyRequest): Promise<CompanyResponse> {
    const { data } = await apiClient.post<CompanyResponse>('/companies', payload)
    return data
  },

  async update(id: number, payload: UpdateCompanyRequest): Promise<CompanyResponse> {
    const { data } = await apiClient.put<CompanyResponse>(`/companies/${id}`, payload)
    return data
  },

  async remove(id: number): Promise<void> {
    await apiClient.delete(`/companies/${id}`)
  },
}