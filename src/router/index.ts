/**
 * Configuración de Vue Router.
 *
 * Estructura de rutas:
 *  - `/login` → pública (el guard la deja pasar sin sesión).
 *  - `/`     → requiere sesión. Usa `MainLayout` como padre y anida
 *              las vistas autenticadas (`dashboard`, `authors`, `books`)
 *              como hijas. Así la sidebar y el topbar se renderizan una
 *              sola vez y el `<RouterView />` dentro del layout cambia.
 *
 * La meta de cada ruta lleva:
 *  - `requiresAuth`: por defecto todo requiere sesión; sólo el login
 *    marca explícitamente `requiresAuth: false`.
 *  - `title`: cadena que muestra el topbar en cada pantalla.
 *
 * El guard `beforeEach` protege las rutas y, además, redirige al
 * dashboard si un usuario logueado intenta volver al login.
 */

import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import MainLayout from '@/layouts/MainLayout.vue'
import LoginView from '@/views/LoginView.vue'
import DashboardView from '@/views/DashboardView.vue'
import AuthorsView from '@/views/authors/AuthorsView.vue'
import BooksView from '@/views/books/BooksView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: LoginView,
      meta: { requiresAuth: false },
    },
    {
      // Ruta padre montada en MainLayout: sus hijas heredan la shell
      // (sidebar + topbar) y se renderizan dentro del <RouterView /> del
      // layout. Al agregar una entidad nueva, basta con sumar otro
      // objeto a `children` y su item correspondiente en SidebarNav.
      path: '/',
      component: MainLayout,
      meta: { requiresAuth: true },
      children: [
        { path: '', name: 'dashboard', component: DashboardView, meta: { title: 'Bienvenido' } },
        { path: 'authors', name: 'authors', component: AuthorsView, meta: { title: 'Autores' } },
        { path: 'books', name: 'books', component: BooksView, meta: { title: 'Libros' } },
      ],
    },
  ],
})

/**
 * Guard global: decide en cada navegación si se permite el acceso.
 *
 * - Si la ruta requiere auth y no hay sesión → manda al login.
 * - Si el usuario logueado intenta ir al login → lo manda al dashboard.
 * - En cualquier otro caso, deja pasar (devolver `undefined` / `true`).
 */
router.beforeEach((to) => {
  const auth = useAuthStore()

  if (to.meta.requiresAuth !== false && !auth.isAuthenticated) {
    return { name: 'login' }
  }

  if (to.name === 'login' && auth.isAuthenticated) {
    return { name: 'dashboard' }
  }
})

export default router
