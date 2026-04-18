<script setup lang="ts">
/**
 * Vista CRUD de Autores — PLANTILLA del patrón del proyecto.
 *
 * Para agregar una entidad nueva, copia este archivo y reemplaza:
 *   - `authorsService` por el service de la entidad nueva.
 *   - `AuthorResponse`, `CreateAuthorRequest` por sus DTOs.
 *   - Los campos del `form` y de la tabla.
 *   - Las reglas de `validate()` según el OpenAPI.
 *
 * Estructura del componente:
 *   1. Estado de la lista: `authors`, `totalRecords`, `loading`,
 *      `pageState` (`{ page, size }`).
 *   2. Estado del diálogo: `dialogVisible`, `submitting`, `editingId`,
 *      `form`, `formError`.
 *   3. Funciones de datos: `fetchPage`, `onPage`.
 *   4. Funciones del diálogo: `resetForm`, `openCreate`, `openEdit`,
 *      `validate`, `handleSubmit`.
 *   5. Funciones de borrado: `confirmDelete`, `handleDelete`.
 *   6. Helper de errores: `handleApiError`.
 *
 * Notas sobre PrimeVue:
 *  - `DataTable` en modo `lazy` pide los datos al backend en cada
 *    cambio de página. Sin `lazy`, ordenaría/paginaría en memoria y
 *    solo vería la página actual, lo que sería incorrecto.
 *  - `useConfirm` y `useToast` dependen de los contenedores globales
 *    `<ConfirmDialog />` y `<Toast />` que están montados en `App.vue`.
 */

import { nextTick, onMounted, reactive, ref } from 'vue'
import { AxiosError } from 'axios'
import DataTable, { type DataTablePageEvent } from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import Message from 'primevue/message'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import { authorsService } from '@/services/authorsService'
import type { AuthorResponse, CreateAuthorRequest } from '@/types/author'
import type { ApiValidationError } from '@/types/api-error'

const toast = useToast()
const confirm = useConfirm()

// --- Estado de la tabla ---------------------------------------------------

/** Página actual de autores (lo que se muestra en la tabla). */
const authors = ref<AuthorResponse[]>([])

/** Total de autores en toda la colección (lo usa el paginador). */
const totalRecords = ref(0)

/** Spinner de la tabla mientras se hace fetch. */
const loading = ref(false)

/**
 * Flag que controla el `v-if` del `<DataTable>`. Lo ponemos en false,
 * esperamos un tick (para que Vue desmonte el componente), actualizamos
 * los datos y lo ponemos en true de nuevo para que remonte con los
 * datos frescos.
 *
 * Por qué: PrimeVue DataTable en modo `lazy` mantiene estado interno
 * que no siempre reacciona al cambio de `:value`. Forzar el remount
 * es más confiable que usar `:key` (que a veces no dispara remount
 * si el reconciliador decide que el componente "se puede actualizar
 * en sitio").
 */
const tableVisible = ref(true)

/**
 * Estado de paginación controlado por el componente.
 * Usamos un `reactive` en lugar de dos refs para agrupar.
 * `page` es 1-indexada (igual que el API); PrimeVue usa 0-indexada
 * internamente, así que convertimos en `onPage`.
 */
const pageState = reactive({ page: 1, size: 10 })

// --- Estado del diálogo de crear/editar ----------------------------------

/** Controla la visibilidad del `<Dialog>`. */
const dialogVisible = ref(false)

/** Spinner del botón Guardar mientras la petición está en vuelo. */
const submitting = ref(false)

/**
 * Si está en `null`, el diálogo crea. Si tiene un id, el diálogo edita.
 * Esta única variable es la que permite que un mismo diálogo sirva
 * para ambos modos.
 */
const editingId = ref<number | null>(null)

/** Mensaje de error a mostrar dentro del diálogo (validaciones o 422). */
const formError = ref('')

/** Modelo del formulario. Se muta directamente con v-model. */
const form = reactive<CreateAuthorRequest>({
  firstName: '',
  lastName: '',
  biography: '',
})

// --- Datos de la tabla ---------------------------------------------------

/**
 * Trae la página actual desde el API y actualiza el estado.
 * Cualquier acción que modifique datos (create/update/delete) llama
 * a esta función al final para reflejar el cambio en la tabla.
 */
async function fetchPage() {
  loading.value = true
  try {
    const result = await authorsService.list(pageState.page, pageState.size)
    console.debug('[AuthorsView] fetchPage →', result.page, 'items:', result.data.length)
    tableVisible.value = false
    await nextTick()
    totalRecords.value = result.page.totalItems
    authors.value = result.data
    tableVisible.value = true
  } catch (err) {
    handleApiError(err, 'No fue posible cargar los autores.')
  } finally {
    loading.value = false
  }
}

/**
 * Callback del evento `@page` de DataTable.
 *
 * PrimeVue manda `event.page` 0-indexado; el API lo espera 1-indexado.
 * `event.rows` es el nuevo tamaño de página si el usuario lo cambió.
 */
function onPage(event: DataTablePageEvent) {
  pageState.page = event.page + 1
  pageState.size = event.rows
  void fetchPage()
}

// --- Diálogo de crear/editar --------------------------------------------

/** Limpia el formulario y sale del modo edición. */
function resetForm() {
  form.firstName = ''
  form.lastName = ''
  form.biography = ''
  editingId.value = null
  formError.value = ''
}

/** Abre el diálogo en modo CREAR. */
function openCreate() {
  resetForm()
  dialogVisible.value = true
}

/** Abre el diálogo en modo EDITAR, prellenando el formulario. */
function openEdit(author: AuthorResponse) {
  resetForm()
  editingId.value = author.id
  form.firstName = author.firstName
  form.lastName = author.lastName
  form.biography = author.biography ?? ''
  dialogVisible.value = true
}

/**
 * Validaciones locales del formulario.
 *
 * Espejan las reglas del backend definidas en `CreateAuthorRequest`.
 * Si hace falta cambiarlas, empieza por el tipo + el OpenAPI, y
 * ajusta estas reglas para que coincidan.
 */
function validate(): boolean {
  if (!form.firstName.trim() || !form.lastName.trim()) {
    formError.value = 'Nombre y apellido son obligatorios.'
    return false
  }
  if (form.firstName.length > 100 || form.lastName.length > 100) {
    formError.value = 'Nombre y apellido no pueden exceder 100 caracteres.'
    return false
  }
  if (form.biography && form.biography.length > 5000) {
    formError.value = 'La biografía no puede exceder 5000 caracteres.'
    return false
  }
  formError.value = ''
  return true
}

/**
 * Envía el formulario al API — crea o actualiza según `editingId`.
 *
 * - Convierte strings vacíos a `null` para campos opcionales (el API
 *   distingue entre "no enviado" y "string vacío").
 * - Cierra el diálogo y refresca la tabla al éxito.
 * - Si el API devuelve 422, muestra el mensaje dentro del diálogo;
 *   cualquier otro error va a un toast global.
 */
async function handleSubmit() {
  if (!validate()) return

  submitting.value = true
  const payload: CreateAuthorRequest = {
    firstName: form.firstName.trim(),
    lastName: form.lastName.trim(),
    biography: form.biography?.trim() ? form.biography.trim() : null,
  }

  try {
    if (editingId.value) {
      await authorsService.update(editingId.value, payload)
      toast.add({
        severity: 'success',
        summary: 'Autor actualizado',
        detail: `${payload.firstName} ${payload.lastName}`,
        life: 3000,
      })
    } else {
      await authorsService.create(payload)
      toast.add({
        severity: 'success',
        summary: 'Autor creado',
        detail: `${payload.firstName} ${payload.lastName}`,
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
      handleApiError(err, 'No fue posible guardar el autor.')
    }
  } finally {
    submitting.value = false
  }
}

// --- Borrado ------------------------------------------------------------

/**
 * Abre el diálogo de confirmación de PrimeVue.
 *
 * `useConfirm().require(...)` es declarativo: recibe el mensaje,
 * labels de botones y callbacks `accept`/`reject`. Nosotros sólo
 * implementamos `accept` — `reject` (cancelar) no necesita lógica.
 */
function confirmDelete(author: AuthorResponse) {
  confirm.require({
    message: `¿Eliminar al autor "${author.firstName} ${author.lastName}"?`,
    header: 'Confirmar eliminación',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Eliminar',
    rejectLabel: 'Cancelar',
    acceptClass: 'p-button-danger',
    accept: () => {
      void handleDelete(author)
    },
  })
}

/**
 * Ejecuta el DELETE y refresca la lista.
 *
 * Edge case: si borramos el último registro de una página que no es
 * la primera, el API devolvería esa página vacía. Para evitarlo,
 * retrocedemos una página antes del refetch.
 */
async function handleDelete(author: AuthorResponse) {
  try {
    await authorsService.remove(author.id)
    toast.add({
      severity: 'success',
      summary: 'Autor eliminado',
      detail: `${author.firstName} ${author.lastName}`,
      life: 3000,
    })
    if (authors.value.length === 1 && pageState.page > 1) {
      pageState.page -= 1
    }
    await fetchPage()
  } catch (err) {
    handleApiError(err, 'No fue posible eliminar el autor.')
  }
}

// --- Helpers ------------------------------------------------------------

/**
 * Muestra un toast de error uniforme.
 *
 * Intenta extraer el mensaje que vino del API (`ApiValidationError.message`);
 * si no hay uno, usa el `fallback` que le pasa el caller.
 */
function handleApiError(err: unknown, fallback: string) {
  let detail = fallback
  if (err instanceof AxiosError) {
    const data = err.response?.data as ApiValidationError | undefined
    detail = data?.message ?? fallback
  }
  toast.add({ severity: 'error', summary: 'Error', detail, life: 4000 })
}

// Al montar, cargamos la primera página.
onMounted(() => {
  void fetchPage()
})
</script>

<template>
  <div class="view-container">
    <div class="view-header">
      <div>
        <h2 class="page-title">Autores</h2>
        <p class="page-subtitle">Gestiona los autores del catálogo.</p>
      </div>
      <Button label="Nuevo autor" icon="pi pi-plus" @click="openCreate" />
    </div>

    <DataTable
      v-if="tableVisible"
      :value="authors"
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
      <Column field="id" header="ID" style="width: 80px" />
      <Column field="firstName" header="Nombre" />
      <Column field="lastName" header="Apellido" />
      <Column header="Biografía">
        <template #body="{ data }">
          <span v-if="data.biography" class="biography-preview">
            {{ data.biography.slice(0, 80) }}{{ data.biography.length > 80 ? '…' : '' }}
          </span>
          <span v-else class="muted">—</span>
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
        <div class="empty-state">No hay autores registrados.</div>
      </template>
    </DataTable>

    <Dialog
      v-model:visible="dialogVisible"
      :header="editingId ? 'Editar autor' : 'Nuevo autor'"
      modal
      :style="{ width: '480px' }"
      :close-on-escape="!submitting"
      :closable="!submitting"
    >
      <form class="form" @submit.prevent="handleSubmit">
        <div class="field">
          <label for="firstName">Nombre *</label>
          <InputText id="firstName" v-model="form.firstName" maxlength="100" fluid />
        </div>
        <div class="field">
          <label for="lastName">Apellido *</label>
          <InputText id="lastName" v-model="form.lastName" maxlength="100" fluid />
        </div>
        <div class="field">
          <label for="biography">Biografía</label>
          <Textarea
            id="biography"
            v-model="form.biography"
            rows="4"
            maxlength="5000"
            auto-resize
            fluid
          />
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

.biography-preview {
  color: var(--color-text);
}

.muted {
  color: var(--color-text-muted);
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
