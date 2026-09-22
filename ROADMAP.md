# Roadmap — La Pizarra

Última actualización: 2026-09-22.

## Hecho (V1)

- Login compartido con WheelOS (mismo Supabase Auth, sin registro propio).
- Lista de tareas con filtros por contexto y por persona asignada.
- Crear tarea / marcar como hecha (toggle binario pendiente↔hecho).
- Responsive: FAB en móvil, botón inline en tablet/desktop.
- Deploy en Cloudflare Workers (static assets) con CI/CD por push a GitHub.

## Hecho (fase 2 — conectar con el negocio real, 2026-08-26)

- **Contexto de cliente en la tarjeta de tarea.** Cuando una tarea tiene cliente asociado, muestra su nombre, teléfono y (si tiene una reparación abierta) marca/modelo del patín y estado — leído en vivo de WheelOS (`clients`, `repairs`), de solo lectura.
- **Pestaña "Reparaciones".** Lista todas las reparaciones activas del taller (no solo las que ya tienen tarea), con botón "+ Tarea" en cada una que abre el formulario ya precargado con el cliente — ya no hace falta escribirlo a mano.
- Verificado de punta a punta en producción con datos y cuenta reales (2026-08-26).
- **Simplificación consciente:** no se evita crear dos tareas para la misma reparación si dos personas usan el botón sin coordinarse. No es grave (se cierra una y ya) — se resuelve más adelante solo si en la práctica resulta molesto.

## Hecho (2026-09-03)

- **Fix: el círculo para reabrir una tarea hecha era invisible.** No era un problema de opacidad (como parecía) sino que la clase de Tailwind que le daba color de fondo/borde nunca generó ninguna regla CSS real — quedaba transparente sobre transparente. Confirmado mirando el color calculado real en el navegador antes de corregirlo. Se cambió a estilo en línea (mismo patrón que ya usa la etiqueta de prioridad).
- **Número de versión visible en la app.** Primero se probó con hash de commit + fecha de build (resultó confuso para el usuario) — se cambió a semver simple leído de `package.json` (`v0.1.0`, luego `v0.2.0`), mostrado chico en el login y en el encabezado. Subir a mano en cada cambio que valga la pena marcar.

## Hecho (2026-09-04)

- **Dominio propio: `lapizarra.wheelos.es`.** `wheelos.es` ya era zona de esta misma cuenta de Cloudflare, así que se agregó como dominio personalizado del Worker (`wrangler.jsonc` → `routes`) y Cloudflare creó el DNS y el certificado SSL solo, sin pasos manuales. Verificado en vivo (login carga con SSL válido). La URL vieja de `workers.dev` se reactivó a pedido del usuario como respaldo (`workers_dev: true`) — ambas URLs sirven la misma app.
- **Texto en voseo argentino corregido.** "Entrá con tu cuenta de WheelOS" → "Entra…" (Login.jsx) y "No tenés permiso…" → "No tienes permiso…" (useTareas.js, mensaje de error de RLS). Se revisó todo `src/` con varios patrones de voseo y no queda ninguno más.
- **Recordatorios v1: banner dentro de la app (v0.3.0).** Pedido explícito del usuario. Arriba de la pantalla, sin importar la pestaña activa, avisa de tareas pendientes con `fecha_límite` de hoy (ámbar) o ya vencida (rojo) — reutiliza los datos que ya se traían para el Calendario, sin pedir nada nuevo a Supabase. Tocar una tarea del banner abre su detalle de siempre. **Verificado por el usuario en producción (2026-09-04): "sí, ya la vi funcionar".** No incluye push ni email todavía — solo avisa si alguien abre la app (ver opciones 2 y 3 evaluadas abajo).

## Hecho (fase 6 — rediseño visual v2, 2026-09-05, v0.5.0)

El usuario generó una especificación con otra herramienta (a partir de una captura real de la app) y la coordinamos en varias rondas antes de construir nada — dos puntos que la especificación daba por hecho sin existir en los datos (un color "cita" separado de "tarea", y una vista Día con horarios) se descartaron antes de tocar código, porque no hay campo de hora ni distinción tarea/cita en la base real.

- **Verde de marca (`--color-brand`, del logo de TG Patinetes) reemplaza al ámbar como acento de navegación/acción.** El ámbar queda EXCLUSIVO para la prioridad "seguimiento" — antes se pisaban los dos significados con el mismo color.
- **Jerarquía visual de la tarjeta por prioridad real:** urgente con sombra dura, seguimiento con bandera lateral, normal con punto, baja atenuada con borde punteado. "Hecha" atenúa la tarjeta completa.
- **Logo real del taller en el header** — leído en vivo de `workshops.logo_icon_url` (WheelOS ya lo tenía guardado como data URI en base64), de solo lectura. Placeholder punteado como respaldo si no carga.
- **Calendario Mes:** días del mes anterior/siguiente atenuados en vez de vacíos; tocar un día muestra su lista debajo de la cuadrícula sin cambiar de pestaña; número del día arriba a la izquierda con los puntos de prioridad pegados abajo (como un calendario real, no flotando en el centro).
- **Calendario Semana:** cada columna muestra el título real de cada tarea (con una rayita de color según su prioridad), no un número — pedido explícito tras ver el "agenda-item" del mockup. Sigue navegando a Día al tocar la columna.
- Reparaciones pasó al mismo sistema visual, botón renombrado a "Generar tarea".
- **Tres bugs reales encontrados y corregidos en el camino** (todos verificados con captura real del usuario, no solo "debería andar"): los puntos de prioridad no se veían por faltar `inline-block` en un `<span>` sin contenido; el número del día estaba a 80% de opacidad (se veía lavado) y el aro de "hoy" salía verde oscuro por una opacidad de `ring` no especificada; y la lógica de "día fuera de mes" estaba directamente invertida (atenuaba los 30 días reales y dejaba los de relleno a full — el más serio de los tres).
- Título "La Pizarra" agrandado en login y header (feedback: se veía chico).

## Hecho (fase 7 — recordatorios reales: push + email, 2026-09-22, v0.6.0)

Handoff técnico del usuario (`la-pizarra-recordatorios-handoff.md`), revisado y coordinado antes de construir (nombres normalizados al esquema existente, un par de vacíos señalados — ver detalle abajo).

- **Cambio de arquitectura:** La Pizarra deja de ser un Worker 100% estático. `worker/index.js` sigue sirviendo la SPA igual que siempre (vía el binding `ASSETS`) y además corre dos Cron Triggers.
- **Push notifications** — aviso a la persona asignada 24h antes de vencer una tarea y el día del vencimiento, cada uno una sola vez (decisión del usuario: sin re-avisos repetidos). Requiere que el usuario toque el ícono de campana en el header para activarlas (pide permiso del navegador).
- **Resumen diario por email** (vía Resend) a las ~10:00 hora España — solo a quien tenga tareas vencidas o para hoy, agrupadas por persona. Nadie recibe email si no tiene nada pendiente.
- **PWA real:** manifest + Service Worker, para que se pueda "añadir a pantalla de inicio" (necesario para que el push funcione en iOS/Safari).
- Migración de Supabase (`push_subscriptions` + columnas `notificado_previo_at`/`notificado_vencimiento_at` en `tareas`) corrida por el usuario mismo en el SQL Editor.

**Pendiente para que funcione de punta a punta:**
- El usuario tiene que crear una cuenta en Resend y correr `wrangler secret put RESEND_API_KEY` — esa clave no debe pasar por el chat.
- El email sale por ahora desde `onboarding@resend.dev` (dominio de pruebas de Resend) — cambiar a una dirección de `wheelos.es` una vez verificado el dominio en el panel de Resend.
- El ícono de la PWA (manifest + apple-touch-icon) es un placeholder genérico — falta reemplazarlo por el logo real del taller.
- No hay todavía forma de **editar** una tarea ya creada (solo crear/marcar hecha/agregar notas) — el handoff pedía resetear los avisos si se cambia la fecha límite, pero esa función no existe aún, así que queda anotado para cuando se construya.
- Las tareas "sin asignar" no disparan ningún aviso (push ni email) — el handoff no definió a quién avisarle en ese caso.

## En curso

- **Validar uso real con el equipo.** Joaquín ("Joaco") ya está usando la app. Falta entrenar a Lili — pendiente por parte del usuario, no técnico. Sin novedades desde el 2026-09-04.
- **Confirmar con el usuario si el rediseño v2 ya lo convence de punta a punta.** Se verificó cada pieza a medida que se construía, pero no hay una revisión final de "sí, así queda" sobre el conjunto completo.

## Próximo (sin fecha aún)

- Confirmar si la fila de prueba "llamar a Ecoscooting" se borra antes de empezar a usar la app en serio.
- Revisar con el usuario las decisiones tomadas sin confirmación explícita: orden de la lista (`created_at desc`).

## Fuera de alcance (fases futuras, no decidido cuándo)

- Estados intermedios de tarea (ej. "en progreso") — hoy el toggle es binario a propósito.

## Deuda técnica pendiente (no bloqueante)

- 6 warnings de oxlint (`react/set-state-in-effect` en `useUsuarios.js`, `useTareas.js`, `useTareasConFecha.js`, `useTareaNotas.js` y `useReparacionesActivas.js`; `react/only-export-components` en `AuthContext.jsx`) — mismos de siempre, ninguno nuevo introducido por el rediseño v2.
- Sin tests automatizados.

## Feedback del usuario (2026-08-25) — ya en marcha

El usuario consideró que La Pizarra "está demasiado simple" y pidió desarrollarla mucho más. Se hizo una lluvia de ideas y se eligió la primera (conectar con las reparaciones/clientes reales de WheelOS) — ver "Hecho (fase 2)" arriba, ya construida y verificada.

## Hecho (fase 3 — bitácora de notas, 2026-09-03)

- **Tabla `tarea_notas`** en Supabase (RLS por taller, mismo patrón que el resto). Cada nota guarda quién la escribió y cuándo, automático.
- **Bitácora completa por tarea** — tocar el contenido de una tarjeta (no el círculo) abre el detalle con el historial de notas y un campo para agregar una nueva, en cualquier momento (pendiente o hecha).
- **Confirmación al marcar hecha** — tocar el círculo de una tarea pendiente pide confirmar, con un campo opcional para dejar la última nota de una vez. Reabrir (hecha → pendiente) sigue siendo instantáneo, sin preguntar.
- **Indicador "💬 N"** en la tarjeta cuando tiene notas.
- Verificado de punta a punta en producción con datos y cuenta reales (2026-09-03): nota agregada desde el detalle, nota agregada al confirmar cierre, contador actualizado en ambos casos.

## Hecho (fase 4 — calendario, 2026-09-03)

- **Vistas Día / Semana / Mes** para las tareas con `fecha_límite` (deadlines o citas, ej. agendar matriculación de un cliente).
- **Mes**: insignia numerada por día (no un punto) — de un vistazo se ve cuántas tareas hay cada día.
- **Semana**: una fila por día con su insignia, encabezado tipo "31 ago – 6 sep" (cruza de mes correctamente).
- **Día**: la tarjeta de tarea de siempre para ese día, con flechas para navegar día a día.
- Tocar un día en Mes o Semana lleva directo a su vista Día.
- A propósito NO incluye reparaciones de WheelOS (no tienen fecha de entrega real en la base — ver nota en el commit).
- Primer diseño (un punto de 4px) no convenció al usuario ("se ve terrible") — se rehizo completo con insignias numeradas y las tres vistas. Verificado en las tres en producción.

## Hecho (fase 5 — calendario funcional + pulido, 2026-09-03)

Tras más feedback del usuario, dos rondas más de ajustes al calendario:

- **Rejilla real en vista Mes.** Cada día pasó a ser una celda con borde y esquinas redondeadas (antes el número flotaba solo, sin nada que lo delimitara). La pastilla con el número de tareas quedó pegada abajo de la celda, no flotando sobre el número.
- **Iniciales de los días de la semana en negrita.**
- **Hueco real encontrado por el usuario: no había forma de ponerle fecha a una tarea.** El formulario "Nueva tarea" nunca tuvo un campo de fecha — por eso nada aparecía en el calendario al crear algo a mano. Se agregó el campo (opcional).
- **El calendario ahora se auto-refresca** al crear cualquier tarea con fecha, sin tener que salir y volver a entrar a la pestaña (antes traía sus datos por separado y no se enteraba).
- **Botón "+ Nueva tarea para este día"** dentro de la vista Día, precarga la fecha que se está mirando — así se puede agendar (ej. matriculación de un cliente) sin escribir la fecha a mano.
- Verificado de punta a punta en producción: crear desde el botón de Día, ver que aparece sin recargar, y que la insignia del mes sube de número.
- **Nota del usuario:** "está mucho mejor, creo que lo podemos hacer mejor, pero no quiero complicarlo mucho" — se pausó aquí a propósito, sin nuevas peticiones de diseño pendientes por ahora. Si en algún momento se retoma, no hay una idea concreta todavía de qué mejorar exactamente.

## Ideas para el futuro (de la misma lluvia de ideas, sin empezar todavía)

Quedaron anotadas para retomar. Orden sugerido por impacto, no es definitivo:

- **Tablero tipo kanban.** Columnas por estado (pendiente / en progreso / hecho) en vez de lista plana, arrastrar y soltar. Aprovecharía que La Secre ya usa 3 estados aunque hoy la app solo muestre 2.
- **Ver la foto adjunta.** La columna `tiene_foto` ya existe y se usa (icono de cámara), pero no hay forma de ver la foto en sí todavía.
- **Notificaciones** cuando te asignan una tarea o algo se pone urgente.
- **Reportes simples.** Ej. "esta semana cerró X tareas Lili, Y Joaquín" — útil para la reunión de los lunes.
- **Agente conversacional de WhatsApp (Evolution API + Dify).** Documentado por separado en el roadmap de La Secre — es un proyecto aparte, no de La Pizarra, pero se evaluó en paralelo a esta misma conversación.
