<script setup lang="ts">
/**
 * Vista CRUD de Libros.
 *
 * Comparte el patrón de `AuthorsView` (ver esa vista para la guía de
 * adaptación a nuevas entidades). Lo extra aquí es:
 *
 *  - Relación M:N con autores: el formulario usa un `<MultiSelect>`
 *    alimentado por `authorsService.list(1, 100)`. Guardamos la lista
 *    completa de autores (`allAuthors`) una sola vez al abrir el
 *    diálogo por primera vez y luego la reutilizamos.
 *  - El cuerpo que se envía al API lleva `authorIds: number[]`, no
 *    los objetos completos — así lo espera el backend.
 *  - Campos opcionales (`isbn`, `synopsis`, `publicationYear`) se
 *    envían como `null` cuando están vacíos, para diferenciar
 *    "no proporcionado" de "string vacío".
 *
 * Limitación consciente del selector: sólo trae las primeras 100
 * autores. Si el catálogo crece más, conviene cambiar a un selector
 * remoto con búsqueda; por ahora mantenemos lo simple para trainees.
 */

import { computed, nextTick, onMounted, reactive, ref } from 'vue'
import { AxiosError } from 'axios'
import DataTable, { type DataTablePageEvent } from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Textarea from 'primevue/textarea'
import MultiSelect from 'primevue/multiselect'
import Tag from 'primevue/tag'
import Message from 'primevue/message'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import { booksService } from '@/services/booksService'
import { authorsService } from '@/services/authorsService'
import type { BookResponse, CreateBookRequest } from '@/types/book'
import type { AuthorResponse } from '@/types/author'
import type { ApiValidationError } from '@/types/api-error'

const toast = useToast()
const confirm = useConfirm()

// --- Estado de la tabla ---------------------------------------------------

const books = ref<BookResponse[]>([])
const totalRecords = ref(0)
const loading = ref(false)
const pageState = reactive({ page: 1, size: 10 })

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

// --- Catálogo de autores para el MultiSelect -----------------------------

/** Lista completa (hasta 100) de autores, usada para poblar el selector. */
const allAuthors = ref<AuthorResponse[]>([])

/** Spinner del MultiSelect mientras se cargan los autores. */
const authorsLoading = ref(false)

// --- Estado del diálogo ---------------------------------------------------

const dialogVisible = ref(false)
const submitting = ref(false)
const editingId = ref<number | null>(null)
const formError = ref('')

/**
 * Modelo local del formulario.
 *
 * Se define un tipo propio (no `CreateBookRequest`) porque usamos
 * strings vacíos en `isbn`/`synopsis` para facilitar el v-model con
 * inputs; al enviar se convierten a `null`.
 */
interface BookForm {
  title: string
  isbn: string
  publicationYear: number | null
  synopsis: string
  authorIds: number[]
}

const form = reactive<BookForm>({
  title: '',
  isbn: '',
  publicationYear: null,
  synopsis: '',
  authorIds: [],
})

/**
 * Opciones para el `<MultiSelect>`.
 *
 * PrimeVue necesita `{ label, id }`. Lo calculamos con `computed`
 * para que se actualice automáticamente si `allAuthors` cambia.
 */
const authorOptions = computed(() =>
  allAuthors.value.map((a) => ({
    id: a.id,
    label: `${a.firstName} ${a.lastName}`,
  })),
)

// --- Datos --------------------------------------------------------------

async function fetchPage() {
  loading.value = true
  try {
    const result = await booksService.list(pageState.page, pageState.size)
    console.debug('[BooksView] fetchPage →', result.page, 'items:', result.data.length)
    tableVisible.value = false
    await nextTick()
    totalRecords.value = result.page.totalItems
    books.value = result.data
    tableVisible.value = true
  } catch (err) {
    handleApiError(err, 'No fue posible cargar los libros.')
  } finally {
    loading.value = false
  }
}

/**
 * Carga la lista de autores para el selector.
 *
 * Se llama la primera vez que el usuario abre el diálogo, y también
 * en `onMounted` para tenerla lista si se abre el dialog apenas
 * cargue la vista.
 */
async function fetchAllAuthors() {
  authorsLoading.value = true
  try {
    const result = await authorsService.list(1, 100)
    allAuthors.value = result.data
  } catch (err) {
    handleApiError(err, 'No fue posible cargar los autores para el selector.')
  } finally {
    authorsLoading.value = false
  }
}

// Convierte el evento de PrimeVue (0-indexado) a nuestra página
// 1-indexada y dispara el refetch.
function onPage(event: DataTablePageEvent) {
  pageState.page = event.page + 1
  pageState.size = event.rows
  void fetchPage()
}

// --- Diálogo de crear/editar --------------------------------------------

function resetForm() {
  form.title = ''
  form.isbn = ''
  form.publicationYear = null
  form.synopsis = ''
  form.authorIds = []
  editingId.value = null
  formError.value = ''
}

/**
 * Abre el diálogo en modo CREAR.
 * Carga la lista de autores si aún no la tenemos.
 */
async function openCreate() {
  resetForm()
  dialogVisible.value = true
  if (allAuthors.value.length === 0) {
    await fetchAllAuthors()
  }
}

/**
 * Abre el diálogo en modo EDITAR, prellenando el formulario.
 *
 * Convertimos `authors: AuthorResponse[]` de la respuesta a
 * `authorIds: number[]` que es lo que el MultiSelect y el payload
 * de update esperan.
 */
async function openEdit(book: BookResponse) {
  resetForm()
  editingId.value = book.id
  form.title = book.title
  form.isbn = book.isbn ?? ''
  form.publicationYear = book.publicationYear
  form.synopsis = book.synopsis ?? ''
  form.authorIds = book.authors.map((a) => a.id)
  dialogVisible.value = true
  if (allAuthors.value.length === 0) {
    await fetchAllAuthors()
  }
}

/**
 * Validaciones locales. Espejan las reglas del OpenAPI para
 * `CreateBookRequest` (ver `types/book.ts`).
 */
function validate(): boolean {
  if (!form.title.trim()) {
    formError.value = 'El título es obligatorio.'
    return false
  }
  if (form.title.length > 200) {
    formError.value = 'El título no puede exceder 200 caracteres.'
    return false
  }
  if (form.isbn && form.isbn.length > 20) {
    formError.value = 'El ISBN no puede exceder 20 caracteres.'
    return false
  }
  if (form.publicationYear !== null) {
    if (form.publicationYear < 1450 || form.publicationYear > 2100) {
      formError.value = 'El año debe estar entre 1450 y 2100.'
      return false
    }
  }
  if (form.synopsis && form.synopsis.length > 10000) {
    formError.value = 'La sinopsis no puede exceder 10000 caracteres.'
    return false
  }
  if (form.authorIds.length === 0) {
    formError.value = 'Selecciona al menos un autor.'
    return false
  }
  formError.value = ''
  return true
}

/**
 * Envía el libro al API — crea o actualiza según `editingId`.
 *
 * Normaliza el payload antes de enviarlo:
 *  - `title`: trim sin perder contenido.
 *  - `isbn` / `synopsis`: `null` cuando quedan vacíos, para no
 *    enviar strings vacíos al API.
 *  - `authorIds`: se envía tal cual; el backend reemplaza la
 *    asociación completa.
 */
async function handleSubmit() {
  if (!validate()) return

  submitting.value = true
  const payload: CreateBookRequest = {
    title: form.title.trim(),
    isbn: form.isbn.trim() ? form.isbn.trim() : null,
    publicationYear: form.publicationYear,
    synopsis: form.synopsis.trim() ? form.synopsis.trim() : null,
    authorIds: form.authorIds,
  }

  try {
    if (editingId.value) {
      await booksService.update(editingId.value, payload)
      toast.add({
        severity: 'success',
        summary: 'Libro actualizado',
        detail: payload.title,
        life: 3000,
      })
    } else {
      await booksService.create(payload)
      toast.add({
        severity: 'success',
        summary: 'Libro creado',
        detail: payload.title,
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
      handleApiError(err, 'No fue posible guardar el libro.')
    }
  } finally {
    submitting.value = false
  }
}

// --- Borrado ------------------------------------------------------------

/** Abre el diálogo de confirmación antes de borrar. */
function confirmDelete(book: BookResponse) {
  confirm.require({
    message: `¿Eliminar el libro "${book.title}"?`,
    header: 'Confirmar eliminación',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Eliminar',
    rejectLabel: 'Cancelar',
    acceptClass: 'p-button-danger',
    accept: () => {
      void handleDelete(book)
    },
  })
}

/**
 * Ejecuta el DELETE y refresca la lista.
 * Si al borrar dejamos vacía una página que no es la primera,
 * retrocedemos antes de hacer fetch (igual que en AuthorsView).
 */
async function handleDelete(book: BookResponse) {
  try {
    await booksService.remove(book.id)
    toast.add({
      severity: 'success',
      summary: 'Libro eliminado',
      detail: book.title,
      life: 3000,
    })
    if (books.value.length === 1 && pageState.page > 1) {
      pageState.page -= 1
    }
    await fetchPage()
  } catch (err) {
    handleApiError(err, 'No fue posible eliminar el libro.')
  }
}

// --- Helpers ------------------------------------------------------------

/** Muestra un toast de error desempaquetando `ApiValidationError` si aplica. */
function handleApiError(err: unknown, fallback: string) {
  let detail = fallback
  if (err instanceof AxiosError) {
    const data = err.response?.data as ApiValidationError | undefined
    detail = data?.message ?? fallback
  }
  toast.add({ severity: 'error', summary: 'Error', detail, life: 4000 })
}

// Al montar cargamos en paralelo la primera página de libros y la
// lista de autores para el selector — así el diálogo abre instantáneo.
onMounted(() => {
  void fetchPage()
  void fetchAllAuthors()
})
</script>

<template>
  <div class="view-container">
    <div class="view-header">
      <div>
        <h2 class="page-title">Libros</h2>
        <p class="page-subtitle">Gestiona los libros del catálogo y asocia sus autores.</p>
      </div>
      <Button label="Nuevo libro" icon="pi pi-plus" @click="openCreate" />
    </div>

    <DataTable
      v-if="tableVisible"
      :value="books"
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
      <Column field="title" header="Título" />
      <Column field="isbn" header="ISBN" style="width: 160px">
        <template #body="{ data }">
          <span v-if="data.isbn">{{ data.isbn }}</span>
          <span v-else class="muted">—</span>
        </template>
      </Column>
      <Column field="publicationYear" header="Año" style="width: 90px">
        <template #body="{ data }">
          <span v-if="data.publicationYear">{{ data.publicationYear }}</span>
          <span v-else class="muted">—</span>
        </template>
      </Column>
      <Column header="Autores">
        <template #body="{ data }">
          <div class="authors-tags">
            <Tag
              v-for="author in data.authors"
              :key="author.id"
              :value="`${author.firstName} ${author.lastName}`"
              rounded
              style="background: var(--color-accent-soft); color: var(--color-primary)"
            />
          </div>
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
        <div class="empty-state">No hay libros registrados.</div>
      </template>
    </DataTable>

    <Dialog
      v-model:visible="dialogVisible"
      :header="editingId ? 'Editar libro' : 'Nuevo libro'"
      modal
      :style="{ width: '560px' }"
      :close-on-escape="!submitting"
      :closable="!submitting"
    >
      <form class="form" @submit.prevent="handleSubmit">
        <div class="field">
          <label for="title">Título *</label>
          <InputText id="title" v-model="form.title" maxlength="200" fluid />
        </div>

        <div class="row">
          <div class="field">
            <label for="isbn">ISBN</label>
            <InputText id="isbn" v-model="form.isbn" maxlength="20" fluid />
          </div>
          <div class="field">
            <label for="year">Año</label>
            <InputNumber
              id="year"
              v-model="form.publicationYear"
              :min="1450"
              :max="2100"
              :use-grouping="false"
              show-buttons
              fluid
            />
          </div>
        </div>

        <div class="field">
          <label for="authors">Autores *</label>
          <MultiSelect
            id="authors"
            v-model="form.authorIds"
            :options="authorOptions"
            option-label="label"
            option-value="id"
            placeholder="Selecciona autores"
            :loading="authorsLoading"
            filter
            display="chip"
            fluid
          />
        </div>

        <div class="field">
          <label for="synopsis">Sinopsis</label>
          <Textarea
            id="synopsis"
            v-model="form.synopsis"
            rows="4"
            maxlength="10000"
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

.authors-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
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

.row {
  display: grid;
  grid-template-columns: 1fr 1fr;
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
