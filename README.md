# La Pizarra

App de tareas compartida de TG Patinetes (JoaK, Joaco, Lili). Ampliación de WheelOS:
mismo proyecto Supabase (base + Auth), repo y despliegue propios. Consume la tabla
`tareas` que ya existe (creada y con RLS cerrado en la fase anterior) — no toca esquema.

## Estructura

```
src/
  main.jsx              # entry point
  App.jsx                # AuthProvider + routing (una sola ruta: "/")
  index.css               # tokens de diseño (Tailwind v4, @theme)
  lib/supabase.js         # cliente Supabase + login/logout (sin signUp)
  context/AuthContext.jsx # sesión + perfil (fila de `users`: workshop_id, role, full_name)
  hooks/useTareas.js       # fetch con filtros + toggleHecho + crearTarea
  hooks/useUsuarios.js     # lista de usuarios del taller (para filtros y "asignar a")
  components/
    FilterPill.jsx
    TaskCard.jsx
    NewTaskModal.jsx
    icons.jsx
  pages/
    Login.jsx
    Tareas.jsx             # pantalla principal
```

Mismo patrón que JoaK Training (`forge-clone`): React 19 + Vite 8 + React Router v7 +
Tailwind v4 (`@tailwindcss/vite`, tokens vía `@theme` en `index.css`) +
`@supabase/supabase-js` + oxlint. Deploy en Cloudflare Workers en modo *static assets*
(`wrangler.jsonc`), sin backend propio.

## Auth compartido con WheelOS — cómo quedó

- **Mismo proyecto Supabase, mismo Auth.** `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`
  apuntan al proyecto de WheelOS (`ejtzoeaqwjktllqvhfsv`) — no se creó ningún proyecto
  nuevo. Un usuario con cuenta en WheelOS (JoaK, Joaco, Lili) puede loguearse acá con el
  mismo email/contraseña.
- **Sin registro (`signUp`) en esta app.** Las cuentas las crea un admin desde WheelOS
  (la Edge Function `invite-user` que ya existe ahí) — La Pizarra solo tiene login, a
  propósito, para no abrir una segunda puerta de alta de usuarios.
- **`AuthContext` carga dos cosas al loguearse:** la sesión de Supabase Auth (`user`) y el
  perfil de negocio (`profile`, la fila de `users` vinculada por `auth_user_id` — trae
  `workshop_id`, `role`, `full_name`). `workshop_id` hace falta porque es `NOT NULL` en
  `tareas` y no se puede derivar solo del JWT del lado del cliente sin una consulta.
- **Importante — esto NO es single sign-on entre WheelOS y La Pizarra.** Son dos apps en
  dos dominios de Cloudflare Workers distintos, cada una guarda su propia sesión en el
  localStorage de su propio origen. "Iniciar sesión una vez" en la instrucción se
  interpretó como *"mismo usuario y contraseña sirven en ambas"*, no como *"loguearse en
  una implica estar logueado en la otra automáticamente"* — eso último requeriría un flujo
  de SSO real (dominio de cookies compartido o similar) que no estaba pedido ni es parte
  de esta fase. Documentado como posible ambigüedad.

## Ambigüedades / decisiones propias

1. **Paleta de prioridad ("normal/seguimiento neutro").** El texto de la instrucción es
   confuso: menciona "seguimiento" dos veces con colores distintos. Se interpretó como
   *normal y baja comparten un tono neutro* (ninguno de los dos tenía color asignado), ya
   que seguimiento ya tiene el suyo (`#C98A2C`) dos palabras antes. Ver `src/index.css`.
2. **Prioridad `"nuevo"` no se ofrece al crear tarea manual.** Es el valor que usa La
   Secre para marcar "recién llegado hoy" — no tiene sentido que alguien la elija a mano.
   Confirma lo ya acordado en `decisiones-rls-tareas.md` (tareas manuales siguen usando
   normal/baja).
3. **Toggle "hecha" es binario** (`pendiente` ↔ `hecho`), ignora `en_progreso` a propósito
   — la instrucción pide "toggle rápido, sin fricción", no una máquina de estados de 3
   pasos. Si más adelante hace falta marcar "en progreso", es una fase aparte.
4. **RLS silencioso en `update`.** Si alguien sin permiso intenta marcar una tarea ajena
   como hecha, PostgREST no tira error — devuelve 0 filas. `toggleHecho()` en
   `useTareas.js` detecta ese caso explícitamente y muestra "No tenés permiso para
   modificar esta tarea" en vez de fallar en silencio o mostrar un check que no se guardó.
5. **Orden de la lista:** no estaba especificado — quedó `created_at desc` (más nuevas
   primero). Fácil de cambiar si se prefiere por prioridad o `fecha_limite`.
6. **Botón "+ nueva tarea" oculto para rol `viewer`**, espejando la misma regla que ya
   aplica la política de RLS de `insert` (`owner`, `admin`, `technician`, `secretary`) —
   es solo UX, RLS ya lo bloquea igual del lado del servidor si alguien lo fuerza.

## Probar localmente

```bash
npm install
npm run dev
```

Abre en `http://localhost:5173` (puerto que asigne Vite) y logueate con una cuenta real
de WheelOS de TG Patinetes (JoaK, Joaco o Lili). `.env` ya viene con la URL y la anon key
del proyecto de WheelOS cargadas — no hace falta configurar nada más para desarrollo.

`npm run build` genera `dist/` (build de producción, ya verificado que compila limpio).
`npm run lint` corre oxlint.

## Qué NO se tocó (a propósito)

- Esquema de `tareas` ni políticas de RLS — ya estaban cerradas.
- Cron de La Secre / WhatsApp — La Pizarra solo lee/muestra lo que ya haya en la tabla.
- Notificaciones push / recordatorios — fase futura.
