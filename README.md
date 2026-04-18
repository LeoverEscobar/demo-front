# demo-front

Cliente web para el proyecto `demo-api-rest`. Un catálogo de libros y
autores construido con Vue 3, PrimeVue y Vite, pensado como proyecto
guía para trainees full-stack.

Si ya trabajaste con la API en `demo-api-rest`, este es el otro lado
de la línea: la aplicación que tus usuarios abren en el navegador y
que consume los endpoints que expusiste desde Symfony.

---

## Tabla de contenidos

1. [¿Qué vas a encontrar aquí?](#1-qué-vas-a-encontrar-aquí)
2. [Antes de empezar — qué necesitas instalado](#2-antes-de-empezar--qué-necesitas-instalado)
3. [Levantar el ambiente paso a paso](#3-levantar-el-ambiente-paso-a-paso)
4. [La arquitectura en capas](#4-la-arquitectura-en-capas)
5. [Cómo fluye un request — ejemplo completo](#5-cómo-fluye-un-request--ejemplo-completo)
6. [Manejo de errores — el patrón que más vas a usar](#6-manejo-de-errores--el-patrón-que-más-vas-a-usar)
7. [Cómo agregar un recurso nuevo — receta paso a paso](#7-cómo-agregar-un-recurso-nuevo--receta-paso-a-paso)
8. [Convenciones de código](#8-convenciones-de-código)
9. [Probar la aplicación](#9-probar-la-aplicación)
10. [Comandos útiles](#10-comandos-útiles)
11. [Troubleshooting](#11-troubleshooting)
12. [Qué leer primero si quieres entender el código](#12-qué-leer-primero-si-quieres-entender-el-código)
13. [Recursos externos recomendados](#13-recursos-externos-recomendados)
14. [¿Preguntas?](#14-preguntas)

---

## 1. ¿Qué vas a encontrar aquí?

Una aplicación web **deliberadamente simple** y **en capas**:

- Un **cliente HTTP** único (axios) con interceptores para JWT y 401.
- **Servicios por entidad**: una función para cada endpoint REST.
- **DTOs escritos a mano** a partir del OpenAPI del backend.
- Un **store de Pinia** que gestiona la sesión y persiste el token
  en `sessionStorage`.
- Un **layout** (sidebar + topbar) que envuelve las vistas
  autenticadas, replicando el estilo del dashboard `ciumb-frontend`
  pero con paleta navy + dorado.
- Dos **vistas CRUD** (Autores y Libros) que sirven como plantilla
  para cualquier entidad nueva.

El objetivo es que leyendo este proyecto puedas aprender:

- Cómo separar responsabilidades en un frontend moderno.
- Cómo consumir un API REST con JWT sin acoplar la lógica a la UI.
- Cómo usar PrimeVue para tablas, diálogos, toasts y confirmaciones.
- Cómo trabajar con TypeScript aplicado al mundo real (DTOs, genéricos).

No es un producto. Es una **plantilla educativa**: el código está
escrito para copiarse y adaptarse, no para producción.

---

## 2. Antes de empezar — qué necesitas instalado

| Herramienta                         | Versión         | Para qué                                                 |
| ----------------------------------- | --------------- | -------------------------------------------------------- |
| **Bun**                             | 1.2+            | Gestor de paquetes y runner de scripts (reemplaza a npm) |
| **Node.js**                         | 20.19+ o 22.12+ | Requerido por algunas dependencias                       |
| **Git**                             | Cualquiera      | Clonar el repo                                           |
| **demo-api-rest** corriendo en `localhost:8000` | —     | Backend al que este cliente se conecta                   |
| **Navegador moderno**               | Chrome/Firefox/Edge | Runtime                                              |
| **WebStorm o VS Code**              | —               | IDE recomendado                                          |

> **Importante**: este proyecto usa **bun**, no npm. Todos los
> comandos de la documentación empiezan con `bun`. Si ejecutas los
> mismos con `npm`, vas a romper el lockfile y algunos scripts
> internos no funcionarán.

**Instalar bun (si no lo tienes):**

- Windows (PowerShell): `powershell -c "irm bun.sh/install.ps1 | iex"`
- macOS / Linux: `curl -fsSL https://bun.sh/install | bash`

**Verifica tu instalación:**

```bash
bun --version    # Debe mostrar 1.2 o superior
node --version   # Debe mostrar v20.19+ o v22.12+
```

**Extensiones recomendadas del IDE:**

- **Vue (Official)** / **Volar** (soporte para `.vue` con TypeScript)
- **ESLint**
- **oxc** (oxlint)
- **Prettier**
- **EditorConfig**

Ya están listadas en `.vscode/extensions.json`, así que VS Code te las
sugerirá al abrir el proyecto.

---

## 3. Levantar el ambiente paso a paso

### TL;DR (flujo completo de un tirón)

```bash
# 1) Tener el backend corriendo en otro terminal:
cd ../demo-api-rest
symfony serve -d
# (o sigue las instrucciones del README del backend)

# 2) Aquí, en el frontend:
cd ../demo-front
bun install
cp .env.example .env     # Windows: copy .env.example .env
bun dev
```

Abre `http://localhost:5173`, inicia sesión, listo.

### Paso a paso

#### 3.1. Clonar e instalar dependencias

```bash
git clone <url-del-repo> demo-front
cd demo-front
bun install
```

`bun install` lee `package.json`, resuelve las dependencias y crea
`bun.lockb` (el lockfile binario de bun). No modifiques ese archivo a
mano.

#### 3.2. Configurar las variables de entorno

Copia el archivo de ejemplo:

```bash
cp .env.example .env      # Linux/macOS
copy .env.example .env    # Windows (cmd)
Copy-Item .env.example .env  # Windows (PowerShell)
```

El `.env` queda así por defecto:

```env
VITE_API_BASE_URL=/api/v1
VITE_API_PROXY_TARGET=http://localhost:8000
```

- `VITE_API_BASE_URL`: prefijo de todas las llamadas de axios. En
  desarrollo mantiene la ruta relativa `/api/v1` para que el proxy de
  Vite enrute hacia el backend y evite problemas de CORS.
- `VITE_API_PROXY_TARGET`: URL donde corre tu backend Symfony. Si
  levantaste `demo-api-rest` en otro puerto, cámbialo aquí.

El archivo `.env` está en `.gitignore` — cada desarrollador tiene el
suyo. `.env.example` sí se versiona para documentar qué variables hay.

#### 3.3. Verificar que el backend esté corriendo

Este cliente **no funciona solo**: necesita que `demo-api-rest` esté
escuchando peticiones.

```bash
# En otra terminal, dentro del repo del backend:
cd C:/Users/devmanuel/PhpstormProjects/demo-api-rest
symfony serve -d
```

Comprueba que responde:

```bash
curl http://localhost:8000/api/v1/doc
```

Debería devolverte HTML (Swagger UI) o JSON (OpenAPI). Si no responde,
revisa el README del backend antes de seguir.

#### 3.4. Levantar el servidor de desarrollo

```bash
bun dev
```

Vite queda escuchando en `http://localhost:5173` con hot reload. Cada
vez que guardes un archivo, el navegador refresca automáticamente.

Abre esa URL en tu navegador. Te debería aparecer la pantalla de login
(fondo navy con gradiente dorado).

#### 3.5. Hacer login

Usa las credenciales que sembraste en el backend (ver sección
"Seed de datos" del README de `demo-api-rest`). Por defecto:

- Email: el que haya en el seed
- Contraseña: la que haya en el seed

Si todo sale bien:

1. El backend devuelve un JWT.
2. El store guarda `{ token, expiresAt, email }` en `sessionStorage`.
3. El router te redirige al dashboard (`/`).
4. Desde el menú lateral puedes ir a Autores o Libros.

---

## 4. La arquitectura en capas

Todo request del usuario viaja por las mismas capas, en este orden:

```
Usuario (navegador)
    │
    ▼
┌─────────────────┐
│      View       │  Componente .vue. Renderiza y captura eventos.
└─────────────────┘
    │
    ▼
┌─────────────────┐
│     Service     │  Encapsula una llamada HTTP concreta.
└─────────────────┘
    │
    ▼
┌─────────────────┐
│   HTTP Client   │  Instancia de axios con interceptores.
└─────────────────┘
    │
    ▼
┌─────────────────┐
│     Backend     │  demo-api-rest (Symfony) responde JSON.
└─────────────────┘
```

Cuando el dato vuelve, recorre el camino inverso:

```
JSON  →  Service (tipa la respuesta)  →  View (renderiza)
```

### Las capas del frontend en detalle

| Carpeta              | Qué hay ahí                           | Analogía con demo-api-rest |
| -------------------- | ------------------------------------- | -------------------------- |
| `src/views/`         | Componentes con rutas asociadas       | `Controller`               |
| `src/components/`    | Componentes reutilizables             | —                          |
| `src/layouts/`       | Shells (sidebar + topbar + contenido) | —                          |
| `src/services/`      | Llamadas HTTP por entidad             | `Service`                  |
| `src/http/client.ts` | Cliente axios único + interceptores   | `ApiExceptionListener`     |
| `src/stores/`        | Estado reactivo compartido (Pinia)    | Session + Security         |
| `src/types/`         | DTOs escritos a mano                  | `Dto\Request` + `Dto\Response` |
| `src/router/`        | Definición de rutas y guards          | Routing + Firewall         |
| `src/config/`        | Configuración de librerías (tema)     | `config/packages/*.yaml`   |
| `src/assets/styles/` | Estilos globales, paleta, tipografía  | —                          |

### La regla que no se rompe

> **Las vistas nunca llaman a `axios` directamente. Llaman a un service.**
> **Los services nunca manejan UI. Sólo devuelven datos.**

Romper esta regla acopla la vista al API: si mañana cambia un endpoint
o se renombra un campo, tienes que tocar veinte componentes en vez de
un archivo.

---

## 5. Cómo fluye un request — ejemplo completo

Supongamos que el usuario hace click en **"Nuevo autor"**, llena el
formulario y presiona **"Guardar"**.

### Paso 1 — La vista captura el evento

`src/views/authors/AuthorsView.vue`

```vue
<Button label="Nuevo autor" icon="pi pi-plus" @click="openCreate" />
```

`openCreate()` resetea el formulario y abre el diálogo.

### Paso 2 — El usuario envía el formulario

```ts
<form @submit.prevent="handleSubmit">
  <!-- inputs con v-model -->
</form>
```

`handleSubmit()` corre las validaciones locales (nombre requerido,
longitud máxima) y, si pasan, construye el payload:

```ts
const payload: CreateAuthorRequest = {
  firstName: form.firstName.trim(),
  lastName: form.lastName.trim(),
  biography: form.biography?.trim() ? form.biography.trim() : null,
}
```

### Paso 3 — La vista llama al service

```ts
await authorsService.create(payload)
```

La vista no sabe nada de axios, URLs ni headers. Sólo conoce el
contrato del service.

### Paso 4 — El service hace la llamada HTTP

`src/services/authorsService.ts`

```ts
async create(payload: CreateAuthorRequest): Promise<AuthorResponse> {
  const { data } = await apiClient.post<AuthorResponse>('/authors', payload)
  return data
}
```

### Paso 5 — El cliente HTTP agrega el token

El interceptor de `request` en `src/http/client.ts` lee el token del
store de auth y lo inyecta en el header:

```
POST /api/v1/authors
Authorization: Bearer eyJ0eXAi...
Content-Type: application/json

{ "firstName": "Gabriel", "lastName": "García Márquez", "biography": null }
```

### Paso 6 — El backend responde

Símfony devuelve el autor creado con su `id`:

```json
{
  "id": 42,
  "firstName": "Gabriel",
  "lastName": "García Márquez",
  "biography": null
}
```

### Paso 7 — La vista reacciona al éxito

De vuelta en `handleSubmit`:

```ts
toast.add({ severity: 'success', summary: 'Autor creado', detail: '...', life: 3000 })
dialogVisible.value = false
await fetchPage()   // recarga la tabla para ver el nuevo registro
```

Ese es el flujo completo: **view → service → cliente → API → service → view**.

---

## 6. Manejo de errores — el patrón que más vas a usar

El backend devuelve errores con un JSON que cumple este contrato:

```json
{
  "code": "validation_error",
  "message": "Los datos enviados no son válidos",
  "errors": {
    "firstName": ["Este campo es obligatorio"],
    "biography": ["No puede exceder 5000 caracteres"]
  }
}
```

En el frontend, ese shape se tipa como `ApiValidationError`
(`src/types/api-error.ts`).

### Los actores

- **Interceptor de response** (`src/http/client.ts`): si el código es
  401, dispara el logout y redirige al login. Cualquier otro error se
  deja pasar al caller.
- **Helper `handleApiError(err, fallback)`** en cada vista CRUD:
  intenta sacar el `message` del body; si no lo encuentra, usa el
  `fallback`. Muestra el resultado en un Toast.

### Patrón en vistas

```ts
try {
  await authorsService.create(payload)
  toast.add({ severity: 'success', summary: 'Autor creado', life: 3000 })
} catch (err) {
  if (err instanceof AxiosError && err.response?.status === 422) {
    // Validación: muestro el error DENTRO del diálogo
    const data = err.response.data as ApiValidationError | undefined
    formError.value = data?.message ?? 'Datos inválidos.'
  } else {
    // Otros errores: toast global
    handleApiError(err, 'No fue posible guardar el autor.')
  }
}
```

### Qué NO hacer

- **No** construyas mensajes de error a mano sin leer `err.response.data`.
- **No** muestres `err.message` (de axios) al usuario: rara vez dice
  algo útil (`"Request failed with status code 422"`).
- **No** hagas `try/catch` en el service: los services propagan
  errores; las vistas deciden cómo mostrarlos.
- **No** olvides el bloque `finally { loading.value = false }` al
  manejar loaders; si la petición falla, el spinner queda girando.

---

## 7. Cómo agregar un recurso nuevo — receta paso a paso

Supongamos que el backend agregó una entidad nueva, `Publisher`
(editorial), con endpoints `/api/v1/publishers` CRUD. Esta es la
receta para soportarla en el frontend.

Tiempo estimado: **30-45 minutos la primera vez, 15-20 después.**

### 7.1. Leer el OpenAPI del backend

Abre `C:\Users\devmanuel\PhpstormProjects\demo-api-rest\docs\openapi.json`
y ubica los schemas `PublisherResponse`, `CreatePublisherRequest`,
`UpdatePublisherRequest`. Anota los campos, tipos y restricciones
(maxLength, nullable, required).

### 7.2. Crear el archivo de tipos

`src/types/publisher.ts`:

```ts
export interface PublisherResponse {
  id: number
  name: string
  country: string | null
}

export interface CreatePublisherRequest {
  name: string        // maxLength 150
  country?: string | null  // maxLength 60
}

export type UpdatePublisherRequest = CreatePublisherRequest
```

### 7.3. Crear el service

`src/services/publishersService.ts`:

```ts
import { apiClient } from '@/http/client'
import type { PaginatedResponse } from '@/types/pagination'
import type {
  PublisherResponse,
  CreatePublisherRequest,
  UpdatePublisherRequest,
} from '@/types/publisher'

export const publishersService = {
  async list(page = 1, size = 20): Promise<PaginatedResponse<PublisherResponse>> {
    const { data } = await apiClient.get('/publishers', { params: { page, size } })
    return data
  },
  async get(id: number) { /* ... */ },
  async create(payload: CreatePublisherRequest) { /* ... */ },
  async update(id: number, payload: UpdatePublisherRequest) { /* ... */ },
  async remove(id: number) { /* ... */ },
}
```

Copia literal `authorsService.ts` y cambia los nombres.

### 7.4. Crear la vista CRUD

`src/views/publishers/PublishersView.vue`:

Copia `src/views/authors/AuthorsView.vue` completo y:

1. Reemplaza todas las menciones de `Author` por `Publisher`.
2. Cambia `authorsService` por `publishersService`.
3. Ajusta los campos del `form` (`name`, `country` en lugar de
   `firstName`, `lastName`, `biography`).
4. Ajusta las columnas de la `DataTable`.
5. Ajusta `validate()` con las reglas del OpenAPI.

### 7.5. Registrar la ruta

`src/router/index.ts`, dentro del array `children` de la ruta `/`:

```ts
{
  path: 'publishers',
  name: 'publishers',
  component: () => import('@/views/publishers/PublishersView.vue'),
  meta: { title: 'Editoriales' },
},
```

### 7.6. Agregar el ítem del menú

`src/components/SidebarNav.vue`:

```ts
const items: NavItem[] = [
  { label: 'Tablero', icon: 'pi pi-home', to: '/' },
  { label: 'Autores', icon: 'pi pi-user-edit', to: '/authors' },
  { label: 'Libros', icon: 'pi pi-book', to: '/books' },
  { label: 'Editoriales', icon: 'pi pi-building', to: '/publishers' },
]
```

El ícono viene del catálogo oficial: https://primevue.org/icons

### 7.7. Verificar

```bash
bun run type-check    # no debería haber errores
bun run lint          # no debería haber warnings
bun dev               # abre el navegador y navega a /publishers
```

Si el backend tiene datos, la tabla debería poblarse, el diálogo
debería crear y editar, y los toasts deberían aparecer. Listo.

---

## 8. Convenciones de código

### 8.1. Idioma

| Qué                                       | Idioma   |
| ----------------------------------------- | -------- |
| Nombres de clases, funciones, variables   | Inglés   |
| Nombres de archivos y carpetas            | Inglés   |
| Rutas URL                                 | Inglés   |
| Mensajes al usuario (toasts, validaciones)| Español  |
| Textos de UI (labels, headers, botones)   | Español  |
| Comentarios y JSDoc descriptivo           | Español  |
| Claves de paths del router                | Inglés   |

Esta mezcla es intencional: el código queda legible para cualquier
developer internacional, y la UI habla el idioma de los usuarios.

### 8.2. Paquetes y scripts

- **Siempre bun, nunca npm.** El lockfile es `bun.lockb`. Si agregas
  una dependencia, usa `bun add <paquete>`.
- Los scripts están definidos en `package.json` y son bun-nativos (no
  usan `npm-run-all`, porque `npm-run-all2` internamente ejecuta `npm`
  y rompería sin npm instalado).

### 8.3. Imports

- **Usa el alias `@/`** para todo lo que esté en `src/`:
  ```ts
  import { apiClient } from '@/http/client'  // ✔
  import { apiClient } from '../../http/client'  // ✘
  ```
- **Types vs value imports**: si sólo usas el tipo, importa con
  `import type`:
  ```ts
  import type { AuthorResponse } from '@/types/author'
  ```

### 8.4. Nombres

| Qué                   | Convención                                 |
| --------------------- | ------------------------------------------ |
| Archivos de componentes| PascalCase (`AuthorsView.vue`)            |
| Archivos de TS         | camelCase (`authorsService.ts`)           |
| Interfaces             | PascalCase (`AuthorResponse`)             |
| Tipos de request       | `Create<Entidad>Request` / `Update<Entidad>Request` |
| Tipos de response      | `<Entidad>Response`                       |
| Services               | `<entidad>sService` (plural, camelCase)   |
| Stores                 | `use<Nombre>Store`                        |
| Rutas                  | kebab-case en el path, camelCase en `name` |

### 8.5. Estilo visual

- **Usa las variables CSS** de `main.css` (`var(--color-primary)`),
  nunca hardcodees hex.
- Para estilos puntuales, `<style scoped>` dentro del SFC.
- Para estilos reutilizables, suma una clase a `main.css`.

### 8.6. Inmutabilidad y funciones puras

- Los services devuelven datos, **no mutan estado global**.
- Los tipos son `interface` o `type` — no usamos clases.
- Las validaciones locales son funciones puras.

---

## 9. Probar la aplicación

Este proyecto no tiene tests automáticos configurados. La verificación
es manual, por el navegador.

### Flujo de humo (sanity check)

1. **Levanta el backend** y siembra datos:
   ```bash
   cd ../demo-api-rest
   php bin/console app:seed
   symfony serve -d
   ```

2. **Levanta el frontend**:
   ```bash
   bun dev
   ```

3. **Abre** `http://localhost:5173`:
   - Debería aparecer el login con fondo navy.

4. **Inicia sesión** con credenciales válidas:
   - El navegador te redirige a `/`.
   - La sidebar muestra tres opciones: Tablero, Autores, Libros.

5. **Navega a Autores**:
   - La tabla se puebla con los datos del seed.
   - El paginador funciona si hay más de 10 registros.
   - Crea un autor nuevo → aparece toast verde, la tabla se recarga.
   - Edita un autor → se actualiza la fila.
   - Elimina un autor → aparece confirm dialog, al aceptar se borra.

6. **Navega a Libros**:
   - Mismo comportamiento + el `MultiSelect` de autores se puebla.
   - Crea un libro y asóciale dos autores.
   - Verifica que los tags de autores aparezcan en la fila.

7. **Refresca la página** (F5):
   - Deberías seguir logueado (gracias a `sessionStorage`).

8. **Cierra la pestaña y abrela de nuevo**:
   - Deberías volver al login (`sessionStorage` se limpia).

9. **Prueba el logout**:
   - Click en el avatar (esquina superior derecha).
   - "Cerrar sesión" → te devuelve al login.

### Probar el manejo de errores

- **Login con credenciales malas** → mensaje "Credenciales inválidas".
- **Crear un autor sin nombre** → mensaje dentro del diálogo.
- **Elimina un autor manualmente del `sessionStorage`** en DevTools
  (`Application > Session Storage > demo-front:auth > delete`) y
  recarga → deberías ir al login.

---

## 10. Comandos útiles

| Comando                        | Qué hace                                              |
| ------------------------------ | ----------------------------------------------------- |
| `bun install`                  | Instala dependencias según `package.json` / `bun.lockb` |
| `bun add <paquete>`            | Agrega una dependencia nueva                          |
| `bun add -d <paquete>`         | Agrega una dependencia de desarrollo                  |
| `bun dev`                      | Servidor de desarrollo con hot reload                 |
| `bun run build`                | Type-check + build de producción (a `dist/`)          |
| `bun run build-only`           | Build sin type-check (más rápido si ya validaste)     |
| `bun run preview`              | Sirve localmente el build de `dist/` para probarlo    |
| `bun run type-check`           | `vue-tsc --build`, sólo chequea tipos                 |
| `bun run lint`                 | Oxlint + ESLint con auto-fix                          |
| `bun run lint:oxlint`          | Sólo Oxlint (rápido, correctness)                     |
| `bun run lint:eslint`          | Sólo ESLint (estilo + Vue rules)                      |
| `bun run format`               | Prettier sobre `src/`                                 |

Limpiar caché del builder (útil si algo se comporta raro):

```bash
rm -rf node_modules/.tmp node_modules/.vite
```

Reinstalación completa (nuclear):

```bash
rm -rf node_modules dist bun.lockb
bun install
```

---

## 11. Troubleshooting

### El navegador muestra "Network Error" al intentar login

Tu backend no está corriendo. Verifica:

```bash
curl http://localhost:8000/api/v1/doc
```

Si no responde, arranca el Symfony (ver README de `demo-api-rest`).

### El backend corre pero igual veo "Network Error" o CORS

Revisa tu `.env`:

```env
VITE_API_PROXY_TARGET=http://127.0.0.1:8000
```

Si tu backend corre en otro puerto (por ejemplo 8080), cambia esa
variable y **reinicia `bun dev`**. Las variables del `.env` sólo se
leen al arrancar el servidor.

Usa **`127.0.0.1`** y no `localhost`: en Windows, Node resuelve
`localhost` primero a `::1` (IPv6) y si Symfony escucha sólo en IPv4
el proxy queda esperando timeout.

### El navegador muestra "blocked by CORS policy" o preflights que cuelgan

Si ves en consola errores tipo:

```
Access to XMLHttpRequest at 'http://127.0.0.1:8000/api/v1/...' from origin
'http://localhost:5173' has been blocked by CORS policy
```

o un `OPTIONS` eterno en pendientes, significa que el navegador está
yendo **directo al backend**, no a través del proxy de Vite. Causas
comunes:

- `VITE_API_BASE_URL` está absoluto (`http://...`) en vez de relativo
  (`/api/v1`). Déjalo relativo para que el proxy lo intercepte:
  ```env
  VITE_API_BASE_URL=/api/v1
  ```
- Algún componente usa `fetch`/`axios` con URL absoluta hardcodeada.
  Siempre importa `apiClient` desde `@/http/client` y deja que él
  resuelva la URL base.

Si de todas formas necesitas consumir el API sin proxy (por ejemplo
en producción o desde otra app), agrega CORS en el backend
(`composer require nelmio/cors-bundle` en Symfony) y asegúrate de
que el servidor responda al método `OPTIONS` en todos los endpoints.

### Guardo/edito y la tabla muestra los datos viejos (o no actualiza)

Síntoma: el PUT/POST responde 200, el `GET` de refresco también, pero
la tabla sigue mostrando la información anterior.

Causa: PrimeVue `DataTable` en modo `lazy` mantiene estado interno
y con `data-key="id"` reutiliza las filas si los IDs no cambian. A
veces no detecta que el contenido de una celda cambió.

Ya está mitigado: cada vista CRUD tiene un ref `tableVisible` que
hace un "toggle" del `v-if` del `<DataTable>` antes y después de
actualizar los datos. Eso fuerza un remount limpio. Si agregas una
entidad nueva, copia el patrón de `AuthorsView.vue`:

```ts
const tableVisible = ref(true)

async function fetchPage() {
  loading.value = true
  try {
    const result = await service.list(page, size)
    tableVisible.value = false
    await nextTick()
    totalRecords.value = result.page.totalItems
    items.value = result.data
    tableVisible.value = true
  } catch (err) { /* ... */ }
  finally { loading.value = false }
}
```

```vue
<DataTable v-if="tableVisible" ...>
```

### Edito y el diálogo se queda con el spinner aunque el backend guardó

Síntoma: haces PUT/POST, Swagger confirma que guardó, pero en el
navegador el botón Guardar queda cargando para siempre. En DevTools
> Network la request aparece como "pending" aunque la respuesta ya
llegó.

Causa: el servidor built-in de PHP responde con `Connection: close`
y **sin** `Content-Length` ni `Transfer-Encoding: chunked`. El
navegador no sabe cuándo termina el cuerpo y queda esperando bytes
que nunca llegan.

Mitigación en el frontend: el proxy de `vite.config.ts` usa
`selfHandleResponse: true` y bufferea la respuesta para añadirle un
`Content-Length` explícito antes de pasársela al navegador.

**Pero el fix correcto es en el backend.** Este workaround está
porque ningún otro cliente (curl, Postman, una app móvil) va a
sufrirlo si el backend devuelve respuestas bien enmarcadas. En
`demo-api-rest` se debería:

1. Usar `symfony server:start` (Go, framing HTTP correcto) en vez
   de `php -S` a mano.
2. O agregar un event listener en `kernel.response` que garantice
   `Content-Length` en toda respuesta no-streaming.

Cuando el backend esté arreglado, el proxy puede simplificarse
eliminando el bloque de buffering.

### Navego por la sidebar y la tabla se queda "pensando" infinito, pero Swagger responde

Síntoma: haces click en "Autores" o "Libros" y la tabla nunca carga;
sin embargo, si tipeas la URL directamente en la barra del navegador
y presionas Enter (recarga completa), sí carga.

Causa: el proxy de Vite reutiliza conexiones TCP con `keepAlive`. En
Windows + Symfony built-in server, esos sockets a veces quedan en
estado "half-open" y la siguiente petición se cuelga.

Ya está mitigado en `vite.config.ts` (agente HTTP con
`keepAlive: false`, timeouts de 30s y logs). Si vuelves a ver el
síntoma:

1. Revisa la terminal donde corre `bun dev`. Deberías ver líneas
   `[proxy →]` (saliendo) y `[proxy ←]` (respuesta).
2. Si sólo ves la flecha `→` y nunca la `←`, Symfony no respondió al
   proxy aunque sí a Swagger. Reinicia `symfony serve` y prueba de
   nuevo.
3. Si aparece `[proxy ✗]`, el mensaje de error te dirá qué pasó
   (ECONNREFUSED si el backend está caído, ETIMEDOUT si no responde).

### Los estilos de PrimeVue no se cargan

Verifica el orden de imports en `src/main.ts`:

```ts
import 'primeicons/primeicons.css'
import '@/assets/styles/main.css'
```

`main.css` debe ir **después** de los estilos de PrimeVue para poder
sobrescribirlos.

### `vue-tsc` se queja de que no encuentra `.vue`

El shim de tipos está en `env.d.ts`. Si por alguna razón se borró o
modificó, restáuralo:

```ts
declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<object, object, unknown>
  export default component
}
```

### Al refrescar quedo logueado pero el siguiente request da 401

El token probablemente expiró (TTL de 1 hora en el backend). El
interceptor de axios debería mandarte al login automáticamente; si
no, el store tiene una sesión vencida. Elimina manualmente:

```
DevTools > Application > Session Storage > demo-front:auth > delete
```

Y recarga.

### Los linters se contradicen

Oxlint y ESLint deberían estar alineados (ESLint importa las reglas
que Oxlint ya cubrió). Si una misma línea la marca uno y el otro la
acepta:

- Corre siempre **primero Oxlint, luego ESLint** (`bun run lint` ya lo
  hace).
- Si el conflicto persiste, revisa `.oxlintrc.json` y `eslint.config.ts`
  para ver quién dueña la regla.

### `bun install` me da errores de "peer dependency"

Bun es estricto con las peer deps. Si son warnings (no errors), los
puedes ignorar. Si son errores bloqueantes:

```bash
bun install --force
```

Y reporta el caso — probablemente sea un bump de versión que hay que
reflejar en `package.json`.

### El dev server se queda colgado al guardar

Reinícialo:

```bash
# Ctrl+C para matar el proceso
bun dev
```

Si pasa seguido, borra cachés:

```bash
rm -rf node_modules/.vite
```

### No puedo instalar bun

Bun requiere Windows 10+ o una distro Linux moderna. En Windows viejo
o ARM sin soporte, temporalmente puedes usar `pnpm` (no `npm`) —
pero avísale al equipo porque **no es el flujo oficial**.

---

## 12. Qué leer primero si quieres entender el código

Lee los archivos en este orden. Cada uno asume que ya leíste los
anteriores.

1. **`src/types/author.ts`** y **`src/types/book.ts`**
   DTOs tipados. Entiende primero qué datos se mueven entre cliente y
   API.

2. **`src/http/client.ts`**
   El cliente HTTP central con interceptores. Es la puerta única
   hacia el backend.

3. **`src/services/authorsService.ts`**
   Un service típico. Cinco funciones, una por endpoint. Es el
   patrón que se repite en toda entidad.

4. **`src/stores/auth.ts`**
   Cómo se gestiona la sesión con Pinia y `sessionStorage`.

5. **`src/main.ts`**
   El punto de entrada. Orden de bootstrap: Pinia → hidratación →
   cliente HTTP → router → PrimeVue.

6. **`src/router/index.ts`**
   Las rutas y el guard que protege lo autenticado.

7. **`src/layouts/MainLayout.vue`**
   La shell visual. Sidebar + topbar + `<router-view />`.

8. **`src/views/LoginView.vue`**
   Flujo completo de autenticación (validación local, llamada al
   service, manejo de errores).

9. **`src/views/authors/AuthorsView.vue`**
   **La plantilla canónica del CRUD**. Si entiendes esta vista,
   entiendes el 80% del frontend.

10. **`src/views/books/BooksView.vue`**
    La variante con MultiSelect y relación M:N.

Cuando termines ese recorrido, ya puedes aplicar la receta de la
sección 7 para agregar tu propia entidad.

---

## 13. Recursos externos recomendados

- **Vue 3 (Composition API)** — https://vuejs.org/guide/introduction.html
- **Pinia** — https://pinia.vuejs.org/
- **Vue Router 4** — https://router.vuejs.org/
- **PrimeVue 4** — https://primevue.org/
- **Catálogo de iconos** — https://primevue.org/icons
- **Catálogo de temas** — https://primevue.org/theming/styled/
- **Vite** — https://vite.dev/
- **axios** — https://axios-http.com/
- **TypeScript Handbook** — https://www.typescriptlang.org/docs/handbook/2/basic-types.html
- **Bun** — https://bun.sh/docs

---

## 14. ¿Preguntas?

Revisa, en orden:

1. **Este README** (probablemente ya está la respuesta).
2. **Los comentarios dentro de los archivos** (están en español y
   explican el "por qué").
3. **El `CLAUDE.md`** en la raíz (resumen técnico para devs que ya
   entienden el proyecto).
4. **El README de `demo-api-rest`** (si la duda es sobre el contrato
   del API).
5. **El OpenAPI** (`demo-api-rest/docs/openapi.json`).

Si después de todo eso sigues sin resolverlo, pregunta sin culpa: es
un proyecto guía, tu duda probablemente le sirva a alguien más.

Buen código.
