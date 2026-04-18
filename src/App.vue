<script setup lang="ts">
/**
 * Componente raíz de la app.
 *
 * Sólo monta tres cosas:
 *  - El `<router-view />` donde Vue Router inyecta la vista actual
 *    (login o el layout autenticado con su propia sub-vista).
 *  - `<Toast />`: contenedor global donde aparecen las notificaciones
 *    que cualquier componente dispara con `useToast().add(...)`.
 *  - `<ConfirmDialog />`: contenedor global para los diálogos de
 *    confirmación que cualquier componente dispara con
 *    `useConfirm().require(...)`.
 *
 * Estos dos contenedores deben montarse una sola vez, típicamente en
 * el root, para que todos los componentes descendientes los encuentren.
 */
import Toast from 'primevue/toast'
import ConfirmDialog from 'primevue/confirmdialog'
</script>

<template>
  <router-view />
  <Toast position="top-right" />
  <ConfirmDialog />
</template>
