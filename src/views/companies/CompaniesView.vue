<script setup lang="ts">
/**
 * Vista CRUD de Empresas.
 *
 * Sigue exactamente el mismo patrón que AuthorsView, pero con los
 * campos de la entidad Company (NIT, nombre, dirección, ciudad, etc.).
 */

import { nextTick, onMounted, reactive, ref } from 'vue'
import { AxiosError } from 'axios'
import DataTable, { type DataTablePageEvent } from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Select from 'primevue/select'
import Message from 'primevue/message'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import { companiesService } from '@/services/companiesService'
import type { CompanyResponse, CreateCompanyRequest } from '@/types/company'
import type { ApiValidationError } from '@/types/api-error'

const toast = useToast()
const confirm = useConfirm()

// --- Estado de la tabla ---------------------------------------------------
const companies = ref<CompanyResponse[]>([])
const totalRecords = ref(0)
const loading = ref(false)
const tableVisible = ref(true)
const pageState = reactive({ page: 1, size: 10 })

// --- Estado del diálogo ---------------------------------------------------
const dialogVisible = ref(false)
const submitting = ref(false)
const editingId = ref<number | null>(null)
const formError = ref('')

const form = reactive<CreateCompanyRequest>({
  nit: '',
  name: '',
  address: null,
  city: null,
  phone: null,
  email: null,
  legalRepresentative: null,
  practicesContactName: null,
  studentCapacity: null,
  sector: null,
  status: 'active',
})

// --- Opciones para el select de estado -----------------------------------
const statusOptions = [
  { label: 'Activa', value: 'active' },
  { label: 'Inactiva', value: 'inactive' },
]

// --- Datos de la tabla ---------------------------------------------------
async function fetchPage() {
  loading.value = true
  try {
    const result = await companiesService.list(pageState.page, pageState.size)
    console.debug('[CompaniesView] fetchPage →', result.page, 'items:', result.data.length)
    tableVisible.value = false
    await nextTick()
    totalRecords.value = result.page.totalItems
    companies.value = result.data
    tableVisible.value = true
  } catch (err) {
    handleApiError(err, 'No fue posible cargar las empresas.')
  } finally {
    loading.value = false
  }
}

function onPage(event: DataTablePageEvent) {
  pageState.page = event.page + 1
  pageState.size = event.rows
  void fetchPage()
}

// --- Diálogo -------------------------------------------------------------
function resetForm() {
  form.nit = ''
  form.name = ''
  form.address = null
  form.city = null
  form.phone = null
  form.email = null
  form.legalRepresentative = null
  form.practicesContactName = null
  form.studentCapacity = null
  form.sector = null
  form.status = 'active'
  editingId.value = null
  formError.value = ''
}

function openCreate() {
  resetForm()
  dialogVisible.value = true
}

function openEdit(company: CompanyResponse) {
  resetForm()
  editingId.value = company.id
  form.nit = company.nit
  form.name = company.name
  form.address = company.address
  form.city = company.city
  form.phone = company.phone
  form.email = company.email
  form.legalRepresentative = company.legalRepresentative
  form.practicesContactName = company.practicesContactName
  form.studentCapacity = company.studentCapacity
  form.sector = company.sector
  form.status = company.status
  dialogVisible.value = true
}

function validate(): boolean {
  if (!form.nit.trim() || !form.name.trim()) {
    formError.value = 'NIT y nombre son obligatorios.'
    return false
  }
  if (form.nit.length > 20) {
    formError.value = 'El NIT no puede exceder 20 caracteres.'
    return false
  }
  if (form.name.length > 200) {
    formError.value = 'El nombre no puede exceder 200 caracteres.'
    return false
  }
  if (form.address && form.address.length > 300) {
    formError.value = 'La dirección no puede exceder 300 caracteres.'
    return false
  }
  if (form.city && form.city.length > 100) {
    formError.value = 'La ciudad no puede exceder 100 caracteres.'
    return false
  }
  if (form.phone && form.phone.length > 30) {
    formError.value = 'El teléfono no puede exceder 30 caracteres.'
    return false
  }
  if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    formError.value = 'El email no es válido.'
    return false
  }
  if (form.email && form.email.length > 150) {
    formError.value = 'El email no puede exceder 150 caracteres.'
    return false
  }
  if (form.legalRepresentative && form.legalRepresentative.length > 200) {
    formError.value = 'El representante legal no puede exceder 200 caracteres.'
    return false
  }
  if (form.practicesContactName && form.practicesContactName.length > 200) {
    formError.value = 'El contacto de prácticas no puede exceder 200 caracteres.'
    return false
  }
  if (form.sector && form.sector.length > 100) {
    formError.value = 'El sector no puede exceder 100 caracteres.'
    return false
  }
  formError.value = ''
  return true
}

async function handleSubmit() {
  if (!validate()) return

  submitting.value = true
  const payload: CreateCompanyRequest = {
    nit: form.nit.trim(),
    name: form.name.trim(),
    address: form.address?.trim() || null,
    city: form.city?.trim() || null,
    phone: form.phone?.trim() || null,
    email: form.email?.trim() || null,
    legalRepresentative: form.legalRepresentative?.trim() || null,
    practicesContactName: form.practicesContactName?.trim() || null,
    studentCapacity: form.studentCapacity,
    sector: form.sector?.trim() || null,
    status: form.status,
  }

  try {
    if (editingId.value) {
      await companiesService.update(editingId.value, payload)
      toast.add({
        severity: 'success',
        summary: 'Empresa actualizada',
        detail: payload.name,
        life: 3000,
      })
    } else {
      await companiesService.create(payload)
      toast.add({
        severity: 'success',
        summary: 'Empresa creada',
        detail: payload.name,
        life: 3000,
      })
    }
    dialogVisible.value = false
    await fetchPage()
  } catch (err) {
    if (err instanceof AxiosError && err.response?.status === 422) {
      const data = err.response.data as ApiValidationError | undefined
      formError.value = data?.message ?? 'Datos inválidos.'
    } else {
      handleApiError(err, 'No fue posible guardar la empresa.')
    }
  } finally {
    submitting.value = false
  }
}

// --- Borrado ------------------------------------------------------------
function confirmDelete(company: CompanyResponse) {
  confirm.require({
    message: `¿Eliminar la empresa "${company.name}"?`,
    header: 'Confirmar eliminación',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Eliminar',
    rejectLabel: 'Cancelar',
    acceptClass: 'p-button-danger',
    accept: () => void handleDelete(company),
  })
}

async function handleDelete(company: CompanyResponse) {
  try {
    await companiesService.remove(company.id)
    toast.add({
      severity: 'success',
      summary: 'Empresa eliminada',
      detail: company.name,
      life: 3000,
    })
    if (companies.value.length === 1 && pageState.page > 1) {
      pageState.page -= 1
    }
    await fetchPage()
  } catch (err) {
    handleApiError(err, 'No fue posible eliminar la empresa.')
  }
}

// --- Helpers ------------------------------------------------------------
function handleApiError(err: unknown, fallback: string) {
  let detail = fallback
  if (err instanceof AxiosError) {
    const data = err.response?.data as ApiValidationError | undefined
    detail = data?.message ?? fallback
  }
  toast.add({ severity: 'error', summary: 'Error', detail, life: 4000 })
}

onMounted(() => void fetchPage())
</script>

<template>
  <div class="view-container">
    <div class="view-header">
      <div>
        <h2 class="page-title">Empresas</h2>
        <p class="page-subtitle">Gestiona el directorio de empresas aliadas.</p>
      </div>
      <Button label="Nueva empresa" icon="pi pi-plus" @click="openCreate" />
    </div>

    <DataTable
      v-if="tableVisible"
      :value="companies"
      :loading="loading"
      lazy
      paginator
      :rows="pageState.size"
      :total-records="totalRecords"
      :rows-per-page-options="[10, 20, 50]"
      data-key="id"
      striped-rows
      :first="(pageState.page - 1) * pageState.size"
      @page="onPage"
    >
      <Column field="nit" header="NIT" style="width: 120px" />
      <Column field="name" header="Nombre" />
      <Column field="city" header="Ciudad" />
      <Column field="phone" header="Teléfono" />
      <Column field="status" header="Estado" style="width: 100px">
        <template #body="{ data }">
          <span :class="data.status === 'active' ? 'status-active' : 'status-inactive'">
            {{ data.status === 'active' ? 'Activa' : 'Inactiva' }}
          </span>
        </template>
      </Column>
      <Column header="Acciones" style="width: 140px">
        <template #body="{ data }">
          <div class="row-actions">
            <Button
              icon="pi pi-pencil"
              text
              rounded
              severity="secondary"
              aria-label="Editar"
              @click="openEdit(data)"
            />
            <Button
              icon="pi pi-trash"
              text
              rounded
              severity="danger"
              aria-label="Eliminar"
              @click="confirmDelete(data)"
            />
          </div>
        </template>
      </Column>
      <template #empty>
        <div class="empty-state">No hay empresas registradas.</div>
      </template>
    </DataTable>

    <Dialog
      v-model:visible="dialogVisible"
      :header="editingId ? 'Editar empresa' : 'Nueva empresa'"
      modal
      :style="{ width: '500px' }"
      :close-on-escape="!submitting"
      :closable="!submitting"
    >
      <form class="form" @submit.prevent="handleSubmit">
        <div class="field">
          <label for="nit">NIT *</label>
          <InputText id="nit" v-model="form.nit" maxlength="20" fluid />
        </div>
        <div class="field">
          <label for="name">Nombre *</label>
          <InputText id="name" v-model="form.name" maxlength="200" fluid />
        </div>
        <div class="field">
          <label for="address">Dirección</label>
          <InputText id="address" v-model="form.address" maxlength="300" fluid />
        </div>
        <div class="field">
          <label for="city">Ciudad</label>
          <InputText id="city" v-model="form.city" maxlength="100" fluid />
        </div>
        <div class="field">
          <label for="phone">Teléfono</label>
          <InputText id="phone" v-model="form.phone" maxlength="30" fluid />
        </div>
        <div class="field">
          <label for="email">Email</label>
          <InputText id="email" v-model="form.email" type="email" maxlength="150" fluid />
        </div>
        <div class="field">
          <label for="legalRepresentative">Representante legal</label>
          <InputText id="legalRepresentative" v-model="form.legalRepresentative" maxlength="200" fluid />
        </div>
        <div class="field">
          <label for="practicesContactName">Contacto de prácticas</label>
          <InputText id="practicesContactName" v-model="form.practicesContactName" maxlength="200" fluid />
        </div>
        <div class="field">
          <label for="studentCapacity">Capacidad de estudiantes</label>
          <InputNumber id="studentCapacity" v-model="form.studentCapacity" fluid />
        </div>
        <div class="field">
          <label for="sector">Sector</label>
          <InputText id="sector" v-model="form.sector" maxlength="100" fluid />
        </div>
        <div class="field">
          <label for="status">Estado</label>
          <Select id="status" v-model="form.status" :options="statusOptions" option-label="label" option-value="value" fluid />
        </div>

        <Message v-if="formError" severity="error" :closable="false">{{ formError }}</Message>

        <div class="form-actions">
          <Button
            type="button"
            label="Cancelar"
            severity="secondary"
            text
            :disabled="submitting"
            @click="dialogVisible = false"
          />
          <Button type="submit" label="Guardar" icon="pi pi-check" :loading="submitting" />
        </div>
      </form>
    </Dialog>
  </div>
</template>

<style scoped>
.row-actions {
  display: flex;
  gap: 4px;
}
.status-active {
  color: #2e7d32;
  background: #e8f5e9;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
}
.status-inactive {
  color: #c62828;
  background: #ffebee;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
}
.empty-state {
  padding: 24px;
  text-align: center;
  color: var(--color-text-muted);
}
.form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.field label {
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text);
}
.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 8px;
}
</style>