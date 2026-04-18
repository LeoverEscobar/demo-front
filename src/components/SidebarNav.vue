<script setup lang="ts">
/**
 * Navegación lateral del MainLayout.
 *
 * Renderiza los ítems del menú con `<router-link>`, que se encarga
 * de la navegación y de exponer la ruta actual. La sidebar decide el
 * ancho; este componente sólo recibe la señal `expanded` para mostrar
 * u ocultar la etiqueta de cada ítem.
 *
 * Para agregar una entrada al menú (p. ej. una entidad nueva), se
 * añade un objeto al array `items` de abajo con:
 *   - `label`: texto visible cuando la sidebar está expandida.
 *   - `icon`: clase de PrimeIcons (catálogo: https://primevue.org/icons).
 *   - `to`: path absoluto hacia la vista registrada en el router.
 */

import { useRoute } from 'vue-router'

/**
 * `expanded`: indica si la sidebar está en modo 240px (muestra etiqueta)
 * o 80px (sólo ícono). Lo controla `MainLayout` y se pasa como prop.
 */
defineProps<{ expanded: boolean }>()

const route = useRoute()

interface NavItem {
  label: string
  icon: string
  to: string
}

/** Ítems del menú. Orden libre; el primero suele ser el dashboard. */
const items: NavItem[] = [
  { label: 'Tablero', icon: 'pi pi-home', to: '/' },
  { label: 'Autores', icon: 'pi pi-user-edit', to: '/authors' },
  { label: 'Libros', icon: 'pi pi-book', to: '/books' },
]

/**
 * Determina si un ítem corresponde a la ruta activa.
 *
 * El dashboard (`/`) requiere coincidencia exacta; si usáramos
 * `startsWith('/')`, todos los ítems quedarían marcados como activos.
 * Las demás rutas matchean por prefijo para que `/authors/123` (si
 * existiera) también marque "Autores" como activo.
 */
function isActive(to: string) {
  if (to === '/') return route.path === '/'
  return route.path.startsWith(to)
}
</script>

<template>
  <nav class="sidebar-nav">
    <router-link
      v-for="item in items"
      :key="item.to"
      :to="item.to"
      class="nav-item"
      :class="{ 'nav-item--active': isActive(item.to), 'nav-item--expanded': expanded }"
    >
      <i :class="item.icon" class="nav-icon"></i>
      <span v-if="expanded" class="nav-label">{{ item.label }}</span>
    </router-link>
  </nav>
</template>

<style scoped>
.sidebar-nav {
  display: flex;
  flex-direction: column;
  padding: 12px 0;
  gap: 2px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 0;
  color: rgba(255, 255, 255, 0.75);
  text-decoration: none;
  border-left: 3px solid transparent;
  transition:
    background-color 0.15s,
    color 0.15s,
    border-color 0.15s;
  justify-content: center;
}

.nav-item--expanded {
  justify-content: flex-start;
  padding-left: 24px;
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.06);
  color: #ffffff;
}

.nav-item--active {
  background: rgba(201, 169, 97, 0.15);
  color: var(--color-accent);
  border-left-color: var(--color-accent);
}

.nav-icon {
  font-size: 18px;
}

.nav-label {
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
}
</style>
