<script setup lang="ts">
/**
 * Layout principal (shell) de la app autenticada.
 *
 * Envuelve todas las vistas que requieren sesión. Consta de tres zonas:
 *  - Sidebar a la izquierda: colapsable entre 80px (sólo íconos) y
 *    240px (íconos + etiquetas). Contiene el menú de navegación.
 *  - Topbar arriba: muestra el título de la pantalla (leído de
 *    `route.meta.title`) y el menú de usuario con el logout.
 *  - Área de contenido: donde Vue Router renderiza la vista hija
 *    mediante el `<router-view />` central.
 *
 * El dropdown del usuario se cierra al hacer click fuera: lo logramos
 * con un listener global en `document` que se registra en `onMounted`
 * y se limpia en `onUnmounted` para no dejar handlers colgando.
 */

import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Button from 'primevue/button'
import Avatar from 'primevue/avatar'
import { useAuthStore } from '@/stores/auth'
import SidebarNav from '@/components/SidebarNav.vue'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

/** `true` cuando la sidebar está expandida (240px). */
const sidebarExpanded = ref(true)

/** `true` cuando el dropdown del avatar está abierto. */
const userMenuOpen = ref(false)

/**
 * Título mostrado en el topbar.
 *
 * Se lee de `route.meta.title`, definido en `router/index.ts` para cada
 * ruta. Si una ruta no lo define, se cae a "Demo Front".
 */
const pageTitle = computed(() => (route.meta?.title as string | undefined) ?? 'Demo Front')

/** Alterna el ancho de la sidebar (80 ↔ 240). */
function toggleSidebar() {
  sidebarExpanded.value = !sidebarExpanded.value
}

/**
 * Alterna el dropdown del usuario.
 *
 * `stopPropagation` evita que el click burbujee hasta el listener
 * global (que cerraría el menú inmediatamente después de abrirlo).
 */
function toggleUserMenu(event: MouseEvent) {
  event.stopPropagation()
  userMenuOpen.value = !userMenuOpen.value
}

/** Cierra el dropdown. Lo llama el listener global al hacer click fuera. */
function closeUserMenu() {
  userMenuOpen.value = false
}

/**
 * Cierra sesión: limpia el store de auth, cierra el dropdown y
 * redirige al login.
 */
async function handleLogout() {
  auth.logout()
  closeUserMenu()
  await router.push({ name: 'login' })
}

// Listener global para cerrar el dropdown al hacer click en cualquier
// parte del documento que no sea el menú en sí. El wrapper del menú
// usa `@click.stop` para no disparar este handler cuando el click
// ocurre dentro del dropdown.
onMounted(() => {
  document.addEventListener('click', closeUserMenu)
})

onUnmounted(() => {
  document.removeEventListener('click', closeUserMenu)
})
</script>

<template>
  <div class="app-shell">
    <aside class="sidebar" :class="{ 'sidebar--expanded': sidebarExpanded }">
      <div class="sidebar-header">
        <span v-if="sidebarExpanded" class="brand-full">DEMO FRONT</span>
        <span v-else class="brand-short">DF</span>
        <Button
          :icon="sidebarExpanded ? 'pi pi-angle-left' : 'pi pi-angle-right'"
          text
          severity="secondary"
          rounded
          class="sidebar-toggle"
          aria-label="Expandir/colapsar menú"
          @click="toggleSidebar"
        />
      </div>
      <SidebarNav :expanded="sidebarExpanded" />
    </aside>

    <div class="main">
      <header class="topbar">
        <h1 class="topbar-title">{{ pageTitle }}</h1>
        <div class="user-menu" @click.stop>
          <button class="user-trigger" type="button" @click="toggleUserMenu">
            <Avatar
              :label="auth.userInitial"
              shape="circle"
              style="background: var(--color-accent); color: var(--color-primary); font-weight: 700"
            />
          </button>
          <div v-if="userMenuOpen" class="user-dropdown">
            <div class="user-dropdown-header">
              <strong>{{ auth.email || 'Sesión' }}</strong>
              <small>Demo Front</small>
            </div>
            <hr />
            <button class="dropdown-item" type="button" @click="handleLogout">
              <i class="pi pi-sign-out"></i>
              <span>Cerrar sesión</span>
            </button>
          </div>
        </div>
      </header>

      <main class="content">
        <router-view />
      </main>
    </div>
  </div>
</template>

<style scoped>
.app-shell {
  display: flex;
  min-height: 100vh;
}

.sidebar {
  width: var(--sidebar-width);
  background: var(--color-primary);
  color: #ffffff;
  transition: width 0.2s ease;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}

.sidebar--expanded {
  width: var(--sidebar-expanded-width);
}

.sidebar-header {
  height: var(--topbar-height);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.brand-full,
.brand-short {
  font-family: var(--font-display);
  font-weight: 700;
  letter-spacing: 0.18em;
  color: var(--color-accent);
}

.brand-full {
  font-size: 18px;
}

.brand-short {
  font-size: 20px;
}

:deep(.sidebar-toggle.p-button) {
  color: rgba(255, 255, 255, 0.8);
}

:deep(.sidebar-toggle.p-button:hover) {
  background: rgba(255, 255, 255, 0.08);
  color: #ffffff;
}

.main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.topbar {
  height: var(--topbar-height);
  background: var(--color-surface-alt);
  border-bottom: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  flex-shrink: 0;
}

.topbar-title {
  font-family: var(--font-display);
  font-size: 22px;
  font-weight: 600;
  margin: 0;
  color: var(--color-primary);
}

.user-menu {
  position: relative;
}

.user-trigger {
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
}

.user-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 220px;
  background: var(--color-surface-alt);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(10, 37, 64, 0.12);
  padding: 12px;
  z-index: 10;
}

.user-dropdown-header {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.user-dropdown-header strong {
  color: var(--color-primary);
  font-size: 14px;
  word-break: break-all;
}

.user-dropdown-header small {
  color: var(--color-text-muted);
  font-size: 12px;
}

.user-dropdown hr {
  border: none;
  border-top: 1px solid var(--color-border);
  margin: 10px 0;
}

.dropdown-item {
  width: 100%;
  background: none;
  border: none;
  padding: 8px 10px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  font-family: inherit;
  font-size: 14px;
  color: var(--color-text);
  text-align: left;
}

.dropdown-item:hover {
  background: var(--color-primary-soft);
  color: var(--color-primary);
}

.content {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
  background: var(--color-surface);
}
</style>
