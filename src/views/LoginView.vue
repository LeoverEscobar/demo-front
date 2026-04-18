<script setup lang="ts">
/**
 * Pantalla de inicio de sesión.
 *
 * Flujo:
 *  1. El usuario escribe email + contraseña y envía el formulario.
 *  2. Validamos localmente (campos no vacíos, email con formato,
 *     contraseña >= 6). Esto es feedback rápido; el backend también
 *     valida y podría rechazar por otras razones.
 *  3. Llamamos a `authService.login(...)`. Si responde OK, el store
 *     guarda el token y navegamos al dashboard.
 *  4. Si el API responde con error, traducimos el status a un mensaje
 *     legible y lo mostramos en el `<Message>` de arriba del botón.
 *
 * Se usa `loading` para deshabilitar inputs y mostrar el spinner del
 * botón mientras la petición está en vuelo, evitando dobles submits.
 */

import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { AxiosError } from 'axios'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Button from 'primevue/button'
import Message from 'primevue/message'
import { authService } from '@/services/authService'
import { useAuthStore } from '@/stores/auth'
import type { ApiValidationError } from '@/types/api-error'

const router = useRouter()
const auth = useAuthStore()

// Estado del formulario y feedback al usuario.
const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

/**
 * Regex simple de email (no es RFC completo; alcanza para UX).
 * La validación real la hace el backend.
 */
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Handler del submit del formulario.
 *
 * Limpia el error anterior, corre las validaciones locales y, si
 * pasan, invoca al service. El `try/finally` garantiza que
 * `loading` vuelva a `false` incluso si la petición falla.
 */
async function handleLogin() {
  error.value = ''

  // Validaciones locales: evitamos disparar la request si ya sabemos
  // que el backend la rechazaría.
  if (!email.value || !password.value) {
    error.value = 'Ingresa correo y contraseña.'
    return
  }

  if (!emailRegex.test(email.value)) {
    error.value = 'Correo electrónico inválido.'
    return
  }

  if (password.value.length < 6) {
    error.value = 'La contraseña debe tener al menos 6 caracteres.'
    return
  }

  loading.value = true
  try {
    const response = await authService.login({ email: email.value, password: password.value })
    // Guardamos la sesión y navegamos. `router.push` es async; lo
    // esperamos para que el error en el push (si ocurriera) caiga en
    // el catch general.
    auth.login(response, email.value)
    await router.push({ name: 'dashboard' })
  } catch (err) {
    // Traducimos el error del API a un mensaje de UI.
    if (err instanceof AxiosError) {
      if (err.response?.status === 401) {
        error.value = 'Credenciales inválidas.'
      } else if (err.response?.status === 422) {
        const data = err.response.data as ApiValidationError | undefined
        error.value = data?.message ?? 'Datos inválidos.'
      } else {
        error.value = 'No fue posible iniciar sesión. Intenta de nuevo.'
      }
    } else {
      error.value = 'Error inesperado.'
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-page">
    <div class="login-container">
      <div class="login-header">
        <h1 class="login-logo">DEMO FRONT</h1>
        <p class="login-subtitle">Catálogo de Libros & Autores</p>
      </div>

      <form class="login-form" @submit.prevent="handleLogin">
        <div class="field">
          <label for="email">Correo</label>
          <InputText
            id="email"
            v-model="email"
            type="email"
            autocomplete="username"
            placeholder="tu@correo.com"
            :disabled="loading"
            fluid
          />
        </div>

        <div class="field">
          <label for="password">Contraseña</label>
          <Password
            id="password"
            v-model="password"
            :feedback="false"
            toggle-mask
            autocomplete="current-password"
            placeholder="••••••"
            :disabled="loading"
            fluid
          />
        </div>

        <Message v-if="error" severity="error" :closable="false" class="error-message">
          {{ error }}
        </Message>

        <Button
          type="submit"
          label="Iniciar sesión"
          icon="pi pi-sign-in"
          :loading="loading"
          class="login-button"
        />
      </form>

      <p class="login-footer">Proyecto guía · Full Stack Trainees</p>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  background:
    linear-gradient(135deg, rgba(10, 37, 64, 0.95), rgba(20, 58, 95, 0.95)),
    radial-gradient(circle at 30% 20%, rgba(201, 169, 97, 0.25), transparent 50%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.login-container {
  width: 100%;
  max-width: 420px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(201, 169, 97, 0.25);
  border-radius: 12px;
  padding: 40px 32px;
  backdrop-filter: blur(8px);
}

.login-header {
  text-align: center;
  margin-bottom: 28px;
}

.login-logo {
  font-family: var(--font-display);
  font-size: 32px;
  font-weight: 700;
  color: var(--color-accent);
  letter-spacing: 6px;
  margin: 0;
}

.login-subtitle {
  color: rgba(255, 255, 255, 0.75);
  font-size: 13px;
  margin: 6px 0 0;
  letter-spacing: 0.04em;
}

.login-form {
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
  color: rgba(255, 255, 255, 0.85);
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 0.02em;
}

:deep(.p-password),
:deep(.p-password-input),
:deep(.p-inputtext) {
  width: 100%;
}

.error-message {
  margin: 0;
}

.login-button {
  margin-top: 4px;
  background: var(--color-accent);
  border-color: var(--color-accent);
  color: var(--color-primary);
  font-weight: 600;
}

.login-button:hover {
  background: var(--color-accent-hover);
  border-color: var(--color-accent-hover);
}

.login-footer {
  margin: 24px 0 0;
  text-align: center;
  color: rgba(255, 255, 255, 0.5);
  font-size: 12px;
}
</style>
