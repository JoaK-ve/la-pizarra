# Roadmap — La Pizarra

Última actualización: 2026-09-03.

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
- **Número de versión visible en la app.** Hash corto del commit + fecha de build, mostrado chico en el login y en el encabezado — para poder confirmar sin adivinar si el navegador está viendo el build más reciente o uno viejo en caché.

## En curso

- **Validar uso real con el equipo.** La app está desplegada pero nadie del taller (Lili, Joaquín, JoaK) ha confirmado poder loguearse y usarla con su cuenta real. Es el paso que falta para pasar de "desplegado" a "en uso".

## Próximo (sin fecha aún)

- Confirmar si la fila de prueba "llamar a Ecoscooting" se borra antes de empezar a usar la app en serio.
- Revisar con el usuario las decisiones tomadas sin confirmación explícita: paleta de color para prioridad normal/baja, orden de la lista (`created_at desc`).

## Fuera de alcance (fases futuras, no decidido cuándo)

- Notificaciones / recordatorios.
- Estados intermedios de tarea (ej. "en progreso") — hoy el toggle es binario a propósito.

## Deuda técnica pendiente (no bloqueante)

- 3 warnings de oxlint (`react/set-state-in-effect` en `useUsuarios.js` y `useTareas.js`; `react/only-export-components` en `AuthContext.jsx`).
- Sin tests automatizados.

## Feedback del usuario (2026-08-25) — ya en marcha

El usuario consideró que La Pizarra "está demasiado simple" y pidió desarrollarla mucho más. Se hizo una lluvia de ideas y se eligió la primera (conectar con las reparaciones/clientes reales de WheelOS) — ver "Hecho (fase 2)" arriba, ya construida y verificada.

## Hecho (fase 3 — bitácora de notas, 2026-09-03)

- **Tabla `tarea_notas`** en Supabase (RLS por taller, mismo patrón que el resto). Cada nota guarda quién la escribió y cuándo, automático.
- **Bitácora completa por tarea** — tocar el contenido de una tarjeta (no el círculo) abre el detalle con el historial de notas y un campo para agregar una nueva, en cualquier momento (pendiente o hecha).
- **Confirmación al marcar hecha** — tocar el círculo de una tarea pendiente pide confirmar, con un campo opcional para dejar la última nota de una vez. Reabrir (hecha → pendiente) sigue siendo instantáneo, sin preguntar.
- **Indicador "💬 N"** en la tarjeta cuando tiene notas.
- Verificado de punta a punta en producción con datos y cuenta reales (2026-09-03): nota agregada desde el detalle, nota agregada al confirmar cierre, contador actualizado en ambos casos.

## Ideas para el futuro (de la misma lluvia de ideas, sin empezar todavía)

Quedaron anotadas para retomar. Orden sugerido por impacto, no es definitivo:

- **Calendario.** Vista con fechas de entrega de reparaciones y `fecha_límite` de tareas urgentes (la columna ya existe en la base, solo falta la vista). Aparte, una agenda simple de citas de recepción — esto sí sería una tabla nueva. **Siguiente en la fila.**
- **Tablero tipo kanban.** Columnas por estado (pendiente / en progreso / hecho) en vez de lista plana, arrastrar y soltar. Aprovecharía que La Secre ya usa 3 estados aunque hoy la app solo muestre 2.
- **Ver la foto adjunta.** La columna `tiene_foto` ya existe y se usa (icono de cámara), pero no hay forma de ver la foto en sí todavía.
- **Notificaciones** cuando te asignan una tarea o algo se pone urgente.
- **Reportes simples.** Ej. "esta semana cerró X tareas Lili, Y Joaquín" — útil para la reunión de los lunes.
- **Agente conversacional de WhatsApp (Evolution API + Dify).** Documentado por separado en el roadmap de La Secre — es un proyecto aparte, no de La Pizarra, pero se evaluó en paralelo a esta misma conversación.
