/**
 * Configuración de Vite.
 *
 * Tres cosas importantes viven aquí:
 *
 *  1. El alias `@` → `src/`, que usamos en todos los imports
 *     (`@/http/client`, `@/types/book`, etc.). Este alias también
 *     está declarado en `tsconfig.app.json` para que TypeScript lo
 *     resuelva: ambos archivos deben mantenerse en sincronía.
 *
 *  2. El proxy de desarrollo: cualquier petición que empiece con
 *     `/api` se reenvía al backend Symfony. Así el cliente no choca
 *     con CORS porque, desde el punto de vista del navegador, todo
 *     sale del mismo origen (`localhost:5173`). La URL del backend
 *     se lee de `VITE_API_PROXY_TARGET` en el `.env` (fallback a
 *     `http://127.0.0.1:8000`, el default del `symfony server:start`).
 *
 *     El proxy usa `selfHandleResponse: true` y bufferea la respuesta
 *     para reescribir el framing: PHP built-in server responde con
 *     `Connection: close` y SIN `Content-Length`, lo que hace que el
 *     navegador quede esperando bytes que nunca llegan. Al bufferear
 *     añadimos un `Content-Length` explícito antes de reenviar.
 *
 *  3. Plugins:
 *     - `@vitejs/plugin-vue`: compila los SFC de Vue.
 *     - `vite-plugin-vue-devtools`: integra el devtools oficial en
 *       el dev server (panel accesible desde el navegador).
 *
 * Nota: `loadEnv` se usa en vez de `import.meta.env` porque el config
 * corre en Node, no en el navegador; `import.meta.env` aquí no está
 * poblado todavía.
 */

import { fileURLToPath, URL } from 'node:url'
import http from 'node:http'

import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // Fallback a 127.0.0.1 (IPv4) en vez de `localhost`: en Windows, Node
  // resuelve `localhost` a ::1 (IPv6) primero y si Symfony escucha solo
  // en IPv4 el proxy cuelga esperando timeout.
  const proxyTarget = env.VITE_API_PROXY_TARGET || 'http://127.0.0.1:8000'

  // Agente HTTP sin keep-alive: forzamos conexión nueva por request.
  // En Windows + Symfony built-in server, la reutilización de
  // conexiones a veces deja sockets en estado "half-open" y las
  // siguientes peticiones quedan colgadas hasta timeout.
  const proxyAgent = new http.Agent({ keepAlive: false })

  return {
    plugins: [vue(), vueDevTools()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      proxy: {
        '/api': {
          target: proxyTarget,
          // `changeOrigin: true` reescribe el header `Host` a la URL
          // del target. Necesario cuando el backend hace virtual
          // hosting por nombre o valida el origen.
          changeOrigin: true,
          agent: proxyAgent,
          // Evita que el proxy intente seguir redirects 3xx — que el
          // cliente los maneje.
          followRedirects: false,
          // Timeouts generosos pero finitos: si el backend no responde
          // en 30s, abortamos en vez de esperar indefinidamente.
          timeout: 30_000,
          proxyTimeout: 30_000,
          // Tomamos control de la respuesta para poder bufferearla y
          // agregar el `Content-Length` antes de enviar al navegador.
          selfHandleResponse: true,
          configure: (proxy) => {
            proxy.on('proxyReq', (_proxyReq, req) => {
              console.log(`[proxy →] ${req.method} ${req.url}`)
            })

            proxy.on('proxyRes', (proxyRes, req, res) => {
              const chunks: Buffer[] = []
              proxyRes.on('data', (chunk: Buffer) => chunks.push(chunk))
              proxyRes.on('end', () => {
                const body = Buffer.concat(chunks)
                console.log(
                  `[proxy ←] ${proxyRes.statusCode} ${req.method} ${req.url} (${body.length}b)`,
                )

                // Copiamos los headers del backend, pero forzamos
                // `Content-Length` y quitamos `Connection: close` /
                // `Transfer-Encoding` para que el cliente sepa
                // exactamente cuándo termina la respuesta.
                const headers = { ...proxyRes.headers }
                delete headers['connection']
                delete headers['transfer-encoding']
                delete headers['content-length']

                res.writeHead(proxyRes.statusCode ?? 500, {
                  ...headers,
                  'Content-Length': String(body.length),
                })
                res.end(body)
              })
              proxyRes.on('error', (err) => {
                console.error(`[proxy ✗] stream error: ${err.message}`)
                if (!res.headersSent) res.writeHead(502)
                res.end()
              })
            })

            proxy.on('error', (err, req, res) => {
              console.error(`[proxy ✗] ${req.method} ${req.url} → ${err.message}`)
              if (res && 'writeHead' in res && !res.headersSent) {
                res.writeHead(502, { 'Content-Type': 'text/plain' })
                res.end(`Proxy error: ${err.message}`)
              }
            })
          },
        },
      },
    },
  }
})
