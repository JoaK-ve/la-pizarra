# Roadmap — La Pizarra

Última actualización: 2026-09-29 (noche).

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

## Hecho (2026-09-28, v0.6.1) — la primera prueba real del push falló; diagnóstico con datos reales

- El cron SÍ corrió (23/09 06:01 UTC), pero `push_subscriptions` estaba vacía: ninguna suscripción llegó a guardarse. Causa: el hook usaba `upsert`, que exige permiso de UPDATE que la tabla no da → fallaba en silencio y la campanita se ocultaba igual.
- Arreglado: el hook usa INSERT (ignora el duplicado), re-sincroniza la suscripción en cada carga de la app y, si falla, la campanita reaparece en rojo con el motivo.
- El Worker ya solo marca un aviso como enviado si el push salió de verdad (antes lo marcaba siempre). Logs del Worker activados (`observability`).
- Verificado: suscripción guardada en la base y push de prueba aceptado por FCM (201).
- Recordar: el push va SOLO a la persona asignada, y esa persona debe activar la campanita en su propio dispositivo.

## Plan de mejoras (análisis profundo del 2026-09-28) — se resuelve punto por punto

Base del análisis: datos reales (10 tareas en 5 semanas, todas manuales y de contexto "taller"; 99 reparaciones en WheelOS, 11 en `terminado` esperando recogida; el taller ya configuró en WheelOS `alert_days_terminado = 7` y `alert_days_stalled = 7`, que La Pizarra ignora). Problema de fondo: es una lista que hay que alimentar a mano al lado de un WheelOS que ya sabe qué necesita atención, y cuando algo falla no lo dice.

**Fase A — Avisos por correo de verdad** (prioridad del usuario) — construida y desplegada en v0.7.0 (2026-09-28); **verificada en real el 2026-09-28**: el usuario pulsó el botón de aviso de prueba (avión de papel en la cabecera) y el correo llegó; el registro `avisos_enviados` confirma correo y push enviados. Falta ver el primer resumen automático real (lo esperado: 29/09 ~10:00 hora España). `wheelos.es` ya estaba verificado en Resend y la migración `avisos_enviados` ya está corrida. Las columnas `tareas.notificado_previo_at`/`notificado_vencimiento_at` ya no se usan: borrarlas cuando se confirme que todo funciona.
- [x] Remitente por taller sobre dominio verificado en Resend: `<fantasy_name> <avisos@wheelos.es>`, respuesta a `workshops.contact_email`. Hoy sale de `onboarding@resend.dev` (sandbox de Resend: solo entrega a la dueña de la cuenta → el correo casi seguro nunca llegó a nadie más).
- [x] Plantilla HTML por taller: logo y nombre del taller, tarjetas Vencidas / Vencen hoy / Vencen mañana con título, prioridad (colores de la app), fecha, descripción, cliente con teléfono pulsable, patinete y estado de la reparación, última nota, botón "Abrir tarea" (deep link `?tarea=<id>`), pie con dirección/teléfono/web del taller. Todo el texto de usuario ESCAPADO (hoy se pega crudo en el HTML).
- [x] Logo servido como imagen alojada por el Worker (Gmail bloquea data URIs).
- [x] Tabla `avisos_enviados` (tarea, persona, canal, tipo, resultado) en lugar de las marcas `notificado_*_at` en `tareas` (esas son por tarea, no por persona: si se reasigna, el nuevo responsable nunca recibe su aviso).
- [x] Usar `users.email` directamente (ya existe en WheelOS; hoy se pide al Admin API sin necesidad).
- [x] Botón "Enviar aviso de prueba" y errores visibles en la app.
- [x] GRANT SELECT a `service_role` en `tarea_notas` (hoy da 403) para poder incluir la última nota en el correo.

**Fase B — Usabilidad básica** — construida y desplegada el 2026-09-28 en 4 entregas (v0.8.0 editar/borrar + errores visibles; v0.8.1 alta rápida; v0.9.0 Mi día; v0.10.0 aviso al asignar). **Falta la verificación real del usuario** de cada una (necesitan su sesión). Para borrar tareas se corrió el SQL de permisos (policy DELETE en `tareas`). Los avisos por asignación se registran en `avisos_enviados` con tipo `asignacion`; hay un anti-spam de 10 min por tarea y persona, y no se avisa a quien se asigna a sí mismo.
- [x] Editar y borrar/archivar tareas (hoy no existe; hay basura como `20206-03-06` y títulos de prueba imposibles de corregir). Validar el año de las fechas.
- [x] Alta rápida: solo título + "Hoy / Mañana / Elegir", opciones extra plegadas. Quitar `contexto` (taller/personal/familia): 100% de las tareas son "taller".
- [x] Pantalla de entrada "Mi día": vencidas / hoy / esta semana / sin fecha, para mí o sin asignar; eliminar las tres filas de filtros.
- [x] Avisar a la persona cuando le asignan una tarea.
- [x] Mostrar errores al usuario (hoy, si RLS bloquea "marcar hecha", no se ve nada).

**Fase C — Integración con WheelOS** — construida y desplegada el 2026-09-28/29 (v0.11.0 llamar/WhatsApp; v0.12.0 `repair_id`; v0.13.0 "Necesitan atención" + plantillas). **Falta la verificación real del usuario** de C2 y C3. Quedan abiertos, a propósito: (1) **cierre automático** al pasar la reparación a `entregado` — NO se implementó: cerrar sola una tarea puede ser un error (p. ej. "facturar" después de entregar); propuesta pendiente de decidir con el usuario: en vez de cerrar, avisar en la tarjeta "la reparación ya está entregada"; (2) **enlaces cruzados con WheelOS**: sigue faltando el patrón de URL de una reparación. Dato real al construir C3: 8 patinetes "terminado" sin recoger en TG Patinetes desde hace 12 a 67 días.
- [x] `tareas.repair_id`: enlazar a la reparación exacta (hoy solo al cliente, y un cliente puede tener varias).
- [x] Botones de un toque para llamar y escribir por WhatsApp desde tarjetas de tarea y de reparación.
- [x] Sección "Necesita atención" con los umbrales del propio taller (`alert_days_terminado`, `alert_days_stalled`), creando la tarea con un toque ("Avisar a X: patinete terminado hace 9 días").
- [x] Plantillas de tarea ("Avisar que está listo", "Pedir repuesto"…) y cierre automático al pasar la reparación a `entregado`.
- [x] Enlaces cruzados con WheelOS: NO es posible hoy -- WheelOS abre cada reparación en una modal, sin URL propia (y La Pizarra solo lee, no toca WheelOS). Se resolvió mostrando el número de orden (p. ej. `8PSVB2`, toque para copiar) en tarjetas, detalle, "Necesitan atención" y correo. Mejora futura que depende de WheelOS: que abra la modal con un parámetro (`?reparacion=<id>`) y entonces añadir el botón "Abrir en WheelOS".

**Fase D — Ajustes por persona y multi-taller** — construida y desplegada el 2026-09-29 (v0.14.1 nombre del taller; v0.15.0 Ajustes + cron horario). **Requiere el SQL de `pizarra_preferencias`** (tabla propia de La Pizarra, sin tocar tablas de WheelOS); sin ese SQL, Ajustes muestra un error y el Worker usa los valores por defecto. Cada persona elige: resumen diario por correo (sí/no y hora 06:00-20:00 de Madrid), push de vencimientos, y aviso al asignarle una tarea. El cron pasó de 2 disparos diarios en UTC a **uno cada hora**, y el Worker decide con la hora de Madrid (Intl): así "las 10:00" son las 10:00 todo el año, sin el desfase de una hora verano/invierno. Supuestos de España, a propósito y anotados: zona horaria Europe/Madrid y prefijo +34 (workshops no guarda país ni zona horaria). Revisión de valores fijos de un taller: no hay ninguno en la lógica.
- [x] Pantalla de ajustes: canales activos, hora del resumen.
- [x] Mostrar el nombre del taller en la cabecera; nada fijo de TG Patinetes en código ni plantillas (hay 2 talleres en WheelOS: TG Patinetes y WheelOS Demo).

**Decisiones del usuario (2026-09-28):** el plan completo está aprobado ("esto me parece perfecto"); se va resolviendo punto por punto. Correo: resumen diario por persona (recomendación aceptada por defecto — confirmar si además quiere aviso inmediato al asignar). `wheelos.es` ya estaba verificado en Resend (respondido). Sigue pendiente de respuesta: el patrón de URL de una reparación en WheelOS (para la fase C).

**Estado al cierre de la sesión (2026-09-28):** las fases A, B, C y D del plan están construidas y desplegadas (v0.15.0). **Verificado con datos reales en la base:** aviso de prueba (push + correo), aviso al asignar a una persona real (correo a otra cuenta, 14:39) y la tabla `pizarra_preferencias` creada y legible por el Worker. El usuario probó Ajustes y dijo que "todo funciona". **Sin confirmar todavía:** que un cambio de Ajustes llegue a guardarse (la tabla seguía vacía), y el primer resumen automático real (esperado el 29/09 a las 10:00 de Madrid). Pendiente de comprobar por el usuario: Mi día, tarea enlazada a su reparación, Necesitan atención y número de orden. **Limpieza hecha (2026-09-28):** columnas `tareas.notificado_previo_at`/`notificado_vencimiento_at` borradas (ya no las usaba nada, reemplazadas por `avisos_enviados`); confirmado que `tareas` sigue funcionando bien. Mejoras futuras: enlace directo a una reparación de WheelOS (depende de WheelOS) y país/zona horaria por taller. **Icono real puesto (2026-09-29, v0.15.1/v0.15.2):** el usuario dejó `Icono La Pizarra.png` (1254×1254, cuadrada de origen, sin rótulo) -- de ahí se generaron con sharp-cli los tamaños 192 y 512 para el manifest de la PWA (antes solo había 64×64), y quedaron también como `maskable` para Android. El apple-touch-icon y el icono de las notificaciones push usan el de 192.

## Hecho (2026-09-29, v0.15.3) -- fix real: la PWA nunca era instalable en Android

El usuario probó desde su Android y no le salía la opción de "Instalar". Causa: el Service Worker no tenía ningún manejador de `fetch` -- Chrome lo exige (aunque no haga nada) para considerar instalable una PWA; sin él, nunca se ofrece instalar. Se agregó un manejador vacío (sin `respondWith`), deja pasar todo a la red igual que antes. **Verificado en real (2026-09-29): el usuario lo instaló desde su Android sin problema.**

## Hecho (2026-09-29, v0.15.4) -- vista previa del enlace y kit de marca

El usuario fue generando el kit de marca de La Pizarra (logo, icono, variantes de color, favicons...). De los 5 archivos limpios que llegaron a la carpeta, se usó el horizontal sobre fondo oscuro para crear `og-image.png` (1200x630, con el mismo fondo exacto de la imagen original) y las etiquetas `og:*`/`twitter:card` en `index.html`: ahora compartir el enlace en WhatsApp/Slack muestra una vista previa con el logo real (antes no mostraba nada).

Los demás archivos limpios (`05_Logo_Fondo_Claro`, `07_Version_Compacta_Solo_Simbolo`) quedan guardados como material de marca sin uso técnico inmediato -- no van en los correos ni en el header, que usan el logo del TALLER, no el de La Pizarra. Dos de los archivos (`08`, `09`) son solo hojas de referencia del kit completo (con rótulos dentro de la imagen), no assets individuales -- de las 12 piezas que el "09" muestra en su índice, solo 5 llegaron como archivos reales.

## Hecho (2026-09-29, v0.15.5) — ícono de La Pizarra junto a su nombre en la cabecera

El logo del taller (grande) y el nombre "La Pizarra" ya convivían en la cabecera, pero "La Pizarra" no tenía su propio símbolo. Se agregó el ícono chico (favicon de 64x64, a 24px) pegado al texto: **[logo del taller]** — **[ícono] La Pizarra** / taller · Hola, nombre. Sin archivo nuevo, reusa el favicon ya existente.

## Próximo — mockup de dashboard (2026-09-29), a retomar mañana

El usuario mostró un mockup completo de dashboard (sidebar, buscador, campanita con notificaciones, tarjetas de números, panel de "Proyectos", calendario de hoy, accesos rápidos). Le encantó la parte visual. Se separó en dos grupos:

**Aprobado en concepto, encaja con los datos reales — construir esto primero:**
- [x] Buscador de tareas por título/cliente (cliente, sobre datos ya cargados) — construido en v0.16.0: `Buscador.jsx`, campo de texto debajo del header (visible en cualquier pestaña), filtra `tareasVisibles` (mismo set que ya se usa para las tarjetas, sin pedir nada nuevo a Supabase) por título, descripción o nombre de cliente; desplegable con hasta 8 resultados, tocar uno abre el detalle de siempre. Antes de construir se mostró un mockup visual (widget) y el usuario lo aprobó ("sí, empieza por el buscador"). Falta verificación real del usuario.
- [x] Campanita con el número real de vencidas+hoy (mismo dato de `Recordatorios.jsx`) que abre esa lista al tocar, en vez del banner rojo fijo de arriba — construido en v0.17.0: `AvisosBell.jsx`, ícono en el header con contador rojo, desplegable con vencidas/para hoy agrupadas, tocar una tarea abre el detalle. `Recordatorios.jsx` (el banner fijo) se borró, ya no lo usaba nada. Convive con el ícono de campana de activar push (aparece solo durante el onboarding, antes de conceder el permiso) sin pisarse porque solo la de avisos lleva número. Falta verificación real del usuario.
- Menú de perfil unificado (avatar/iniciales + nombre + taller, con Ajustes y Cerrar sesión adentro) — hoy son botones sueltos en la cabecera.
- Tarjetas de números REALES (ej. "N pendientes", "N vencidas", "N hechas esta semana") en vez de las 4 categorías inventadas del mockup (el mockup tenía "En progreso"/"En revisión" que no existen en nuestro modelo).

**NO se construye sin antes decidirlo aparte — no encaja con el alcance actual:**
- **"Proyectos" multi-negocio** (el mockup mostraba TG Patinetes, Semilla, CetrerOS, OídoChef, Marketing, Joak Training como "proyectos" separados): esto convertiría La Pizarra en un gestor de TODOS los negocios/proyectos del usuario, no solo del taller. Es una decisión de producto grande, no un ajuste visual — pendiente de conversación aparte.
- Estados intermedios de tarea ("en progreso"/"en revisión") — ya se había decidido a propósito que el estado es binario (pendiente/hecha); el mockup asume 4 estados.
- La foto de fondo del encabezado y la barra lateral fija (sidebar) son cambios de layout más grandes — se consideran aparte, no en este primer paso.

## En curso

- **Verificación real por el usuario de las fases B, C y D** (ver el estado al cierre de arriba).
- **Por verificar de la fase A:** (1) que el logo ya se ve en el correo tras v0.7.1; (2) el primer resumen automático real, esperado el 29/09 ~10:00 hora España (hay una tarea urgente que vence el 29/09).
- **Validar uso real con el equipo.** Joaquín ("Joaco") ya está usando la app. Falta entrenar a Lili — pendiente por parte del usuario, no técnico. Sin novedades desde el 2026-09-04.
- **Confirmar con el usuario si el rediseño v2 ya lo convence de punta a punta** — el usuario expresó insatisfacción general con el uso ("no estoy contento con cómo funciona"), no con lo visual: de ahí el plan de arriba.

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
