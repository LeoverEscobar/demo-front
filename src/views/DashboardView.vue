<script setup lang="ts">
/**
 * Dashboard (pantalla de inicio después de iniciar sesión).
 *
 * Hoy es un placeholder de bienvenida: saluda al usuario por su
 * email y muestra pistas de navegación. Cuando el proyecto crezca,
 * este es el lugar natural para sumar KPIs (totales, últimos
 * registros, etc.): instanciar los services en `onMounted`, guardar
 * los resultados en refs y renderizarlos aquí.
 */
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
</script>

<template>
  <div class="view-container">
    <div class="welcome-card">
      <h2 class="welcome-title">Bienvenido</h2>
      <p class="welcome-text">
        Hola <strong>{{ auth.email }}</strong
        >. Este es el panel del catálogo de libros y autores. Usa el menú lateral para navegar entre
        los recursos del API.
      </p>
      <ul class="hint-list">
        <li>
          <i class="pi pi-user-edit"></i>
          <span><strong>Autores</strong> — registra, edita o elimina autores.</span>
        </li>
        <li>
          <i class="pi pi-book"></i>
          <span><strong>Libros</strong> — gestiona libros y asocia varios autores.</span>
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.welcome-card {
  background: var(--color-surface-alt);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 32px;
  max-width: 720px;
}

.welcome-title {
  font-family: var(--font-display);
  font-size: 32px;
  margin: 0 0 12px;
  color: var(--color-primary);
}

.welcome-text {
  color: var(--color-text);
  margin: 0 0 20px;
  font-size: 15px;
  line-height: 1.6;
}

.hint-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.hint-list li {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: var(--color-primary-soft);
  border-radius: 8px;
  color: var(--color-text);
}

.hint-list i {
  color: var(--color-accent-hover);
  font-size: 18px;
}
</style>
