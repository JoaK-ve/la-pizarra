# Diagnóstico completo — La Pizarra

Fecha del diagnóstico: 2026-08-24. Metodología: inspección directa del proyecto real (código, `git`, Supabase, Cloudflare) en esta sesión. No se usó memoria de conversaciones previas ni el README como fuente de verdad — cada afirmación está etiquetada según su nivel de verificación real.

Leyenda: **VERIFICADO** (comprobado directamente hoy) · **DOCUMENTADO PERO NO VERIFICADO** (dicho en código/docs, no comprobado en vivo) · **ESTIMACIÓN** · **DESCONOCIDO**.

---

## PROYECTO

La Pizarra: app de tareas compartidas para TG Patinetes (taller de reparación de patinetes eléctricos, Alcoy, España — familia JoaK/Joaco/Lili). Extensión del ecosistema WheelOS: comparte el mismo proyecto Supabase (`ejtzoeaqwjktllqvhfsv`, "JoaK-ve's WheelOS") para base de datos y autenticación, con repo y despliegue propios. **VERIFICADO**.

## ESTADO

Desplegada en producción en `https://la-pizarra.chefjoak.workers.dev` (Cloudflare Workers, modo static assets). La pantalla de login carga sin errores de consola (verificado en fase previa de esta misma sesión de trabajo). **VERIFICADO**. No hay evidencia de uso real por el equipo del taller más allá de una prueba manual (ver USO REAL). **VERIFICADO** (ausencia de evidencia).

## AVANCE

Para el alcance de V1 descrito en el propio README (login compartido, lista de tareas con filtros, crear/marcar hecha, responsive móvil/tablet/desktop), el código está completo: compila limpio y despliega sin errores. **Estimación: ~90–95% del alcance V1.** **ESTIMACIÓN**, basada en comparar el README (alcance declarado) contra el código fuente inspeccionado (implementación real) — ambos coinciden. No incluye funcionalidades secundarias fuera de V1 (notificaciones, recordatorios — explícitamente fuera de alcance según el propio README).

## USO REAL

- `tareas` contiene **1 fila** (verificada con `select count(*) from tareas` y `select * from tareas` directamente en el SQL Editor de Supabase). **VERIFICADO**.
- Esa fila: `titulo`="llamar a Ecoscooting", `descripcion`="kjsh kjdahdfkjadh f..." (texto sin sentido), `origen`="manual", `prioridad`="urgente", `estado`="hecho", `created_at`=2026-08-24 14:21:01, `updated_at`=2026-08-24 14:21:07 (6 segundos después). Es evidentemente una prueba manual de humo del flujo crear→marcar hecha, no una tarea de trabajo real. **VERIFICADO** (dato objetivo: mismo día, contenido sin sentido, ciclo de 6 segundos).
- Existen 5 cuentas reales en el workshop de TG Patinetes que podrían usar la app (comparten Auth con WheelOS): Liliana González Díaz (admin), Joaquín Tejero Colvee (owner), Joaquín Andrés Tejero González (admin), JoaK (secretary), Visitante (viewer). **VERIFICADO** (consulta directa a `users`).
- No hay ninguna evidencia de que alguna de esas cuentas reales haya iniciado sesión o creado una tarea real. **NO VERIFICABLE desde aquí** — Supabase Auth no expone logs de sesión consultables por SQL simple en este pase; se concluye por ausencia de datos en `tareas` más allá de la fila de prueba.

**Conclusión: uso real = 0. Todo lo que hay en la base es una prueba de desarrollo, no trabajo real del taller.**

## PRIORIDAD TÉCNICA

Media. No hay bugs bloqueantes conocidos ni deuda técnica grave. El riesgo no es técnico sino de adopción: nadie ha confirmado que el login funcione con una cuenta real del taller (no se pudo probar en este proceso por no tener credenciales).

## FASE

Post-deploy, pre-adopción. El pipeline de build/deploy funciona de punta a punta; falta la validación con usuarios reales.

## SIGUIENTE ACCIÓN

Confirmar con el equipo (Lili, Joaquín, JoaK) que pueden iniciar sesión con sus credenciales reales de WheelOS y crear/gestionar tareas reales. Decidir si la fila de prueba "llamar a Ecoscooting" se borra antes de empezar a usar la app en serio.

## BLOQUEADO

No. La app está técnicamente operativa.

## BLOQUEO

Ninguno técnico. El único punto pendiente es de validación de uso, no de código ni infraestructura.

## DECISIONES PENDIENTES

- Paleta de prioridad: "normal" y "baja" comparten color neutro — es una interpretación propia documentada en el README ante una instrucción ambigua, nunca confirmada explícitamente por el usuario. **DOCUMENTADO PERO NO CONFIRMADO POR EL USUARIO**.
- Orden de la lista de tareas (`created_at desc`) — no estaba especificado, quedó como decisión de desarrollo. Fácil de cambiar si se prefiere por prioridad o `fecha_limite`.
- Notificaciones/recordatorios — declarado explícitamente como fase futura, sin fecha ni decisión de diseño.

## DEPENDENCIAS

- Supabase compartido con WheelOS (mismo proyecto, mismo esquema de `tareas`, mismo Auth). Cualquier cambio de esquema o RLS hecho desde el lado de WheelOS afecta directamente a La Pizarra.
- Alta de usuarios: depende de la Edge Function `invite-user` de WheelOS — La Pizarra no tiene registro propio a propósito.

## DEUDA TÉCNICA

- 3 warnings de `oxlint` (verificado hoy corriendo `npm run lint`): `react/set-state-in-effect` en `src/hooks/useUsuarios.js:16` y `src/hooks/useTareas.js:37`; `react/only-export-components` en `src/context/AuthContext.jsx:62`. No bloqueantes, no corregidos.
- 0 archivos de test en el repo (confirmado por inspección del árbol de archivos).
- Bundle único sin code-splitting: 452.55 KB / 131.01 KB gzip (verificado en `npm run build` de hoy) — aceptable para el alcance actual, pero sin lazy-loading si el proyecto crece.

## SEGURIDAD

- `npm audit`: **0 vulnerabilidades** (verificado hoy).
- RLS activo en `tareas`: `rowsecurity = true` (verificado). 4 políticas (`SELECT`, `INSERT`, `UPDATE`, `DELETE`), todas con rol declarado `public` — el filtrado real depende de expresiones internas basadas en `auth.uid()` (según `decisiones-rls-tareas.md`); **no se re-verificó el texto exacto de cada expresión `USING`/`WITH CHECK` en este pase**, solo su existencia, tipo de comando y rol asociado. **VERIFICADO PARCIAL**.
- GRANTs a `authenticated`: `DELETE, INSERT, SELECT, UPDATE` completos en `tareas` (verificado directamente vía `information_schema.role_table_grants`).
- GRANTs a `anon`: solo `REFERENCES, TRIGGER, TRUNCATE` — sin `SELECT/INSERT/UPDATE/DELETE`, es decir la anon key no puede leer ni escribir datos reales. **VERIFICADO**.
- `.env` local con las claves reales existe y está confirmado fuera de git (gitignored). No se encontraron secretos hardcodeados en el código fuente inspeccionado.

## TESTS

No existen tests automatizados (0 archivos). Verificación manual hecha hoy:
- `npm run build` → compila en 879ms, sin errores.
- `npm run lint` → 3 warnings, 0 errores.
- `npm audit` → 0 vulnerabilidades.
No se probó el login con una cuenta real por no disponer de credenciales durante este proceso — **NO VERIFICADO**.

## INFRAESTRUCTURA

- Cloudflare Workers, modo *static assets* (`wrangler.jsonc`: `assets.directory = "./dist"`, `not_found_handling = "single-page-application"`).
- Repo GitHub público `JoaK-ve/la-pizarra`, rama `main`, **1 commit** (`bf7597c`), working tree limpio, remoto configurado. **VERIFICADO** (`git log`, `git status`, `git remote -v` corridos hoy).
- Conectado a Cloudflare Workers Builds (auto-deploy por push) — confirmado funcionando en el dashboard de Cloudflare (proyecto `la-pizarra` listado, último build "44m ago" al momento de este diagnóstico). **VERIFICADO**.
- Variables de entorno de build (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) cargadas correctamente en Cloudflare — inferido de que el login carga sin errores de consola en producción.
- Supabase: mismo proyecto que WheelOS, sin proyecto propio creado (por diseño).

## ÚLTIMA ACTUALIZACIÓN IMPORTANTE

Deploy inicial completo y verificado en vivo — 2026-08-24 (misma fecha del único commit y de la fila de prueba en `tareas`).

## CONFIANZA DEL DIAGNÓSTICO

**Alta** en todo lo técnico: código, build, lint, auditoría de dependencias, esquema y permisos de base de datos, estado de git y de Cloudflare — todo inspeccionado directamente en esta sesión, hoy.
**Baja** en "uso real por el equipo": no hay forma de confirmar login/uso real de Lili/Joaquín/JoaK sin acceso a sus cuentas; la conclusión de "uso real = 0" se basa en ausencia de evidencia en la tabla `tareas`, no en una verificación directa de sesiones de usuario.

## RESUMEN EJECUTIVO

La Pizarra está técnicamente terminada para su alcance V1 y desplegada en producción con un pipeline de CI/CD funcional (push a GitHub → build automático en Cloudflare). El código compila limpio, pasa lint con advertencias menores no bloqueantes, no tiene vulnerabilidades conocidas, y los permisos de base de datos están correctamente configurados para el rol que usa el navegador (`authenticated`). Sin embargo, no hay ninguna evidencia de que el equipo real de TG Patinetes la haya usado: la única fila en la base de datos es una prueba manual de desarrollo, creada y cerrada en 6 segundos el mismo día del deploy. El proyecto está listo para usarse — lo que falta no es trabajo técnico, sino confirmar que el equipo real lo adopte.

## EVIDENCIAS

- `git -C "La Pizarra" log --oneline` → `bf7597c Primera version de La Pizarra...`; `git status` → working tree limpio; `git remote -v` → `github.com/JoaK-ve/la-pizarra.git`. (Terminal, 2026-08-24.)
- `npm run build` (2026-08-24): 77 módulos, compila en 879ms, sin errores. Output: `dist/assets/index-BD6zbBNg.js` 452.55 KB (131.01 KB gzip).
- `npm run lint` (oxlint, 2026-08-24): 3 warnings listados arriba, 0 errores.
- `npm audit` (2026-08-24): "found 0 vulnerabilities".
- SQL Editor de Supabase (dashboard, 2026-08-24):
  - `select tablename, rowsecurity from pg_tables where tablename in ('tareas','secre_conversaciones')` → ambas con `rowsecurity = true`.
  - `select tablename, policyname, cmd, roles from pg_policies where tablename in (...)` → 4 filas para `tareas` (SELECT/INSERT/UPDATE/DELETE, rol `{public}`), 0 filas para `secre_conversaciones`.
  - `select table_name, grantee, string_agg(privilege_type,',') from information_schema.role_table_grants where table_name in (...) group by table_name, grantee` → `authenticated` con `DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE` en `tareas`; `anon` solo con `REFERENCES,TRIGGER,TRUNCATE`.
  - `select tablename, tableowner from pg_tables where tablename in (...)` → dueño de ambas tablas: `postgres`.
  - `select (select count(*) from tareas), (select count(*) from secre_conversaciones)` → `1, 0`.
  - `select * from tareas` → única fila detallada arriba (USO REAL).
  - `select id, full_name, role, workshop_id from users where workshop_id = 'd53036e4-b3e3-4a34-ab10-8cba92c0fab7'` → 5 cuentas reales listadas arriba.
- Dashboard de Cloudflare (Workers & Pages, 2026-08-24): proyecto `la-pizarra` listado, dominio `la-pizarra.chefjoak.workers.dev`, conectado a `JoaK-ve/la-pizarra`, "44m ago" desde el último build al momento del diagnóstico.
- Captura de pantalla de `https://la-pizarra.chefjoak.workers.dev` (fase previa de esta misma sesión): pantalla de login renderizada, 0 errores en la consola del navegador.

---

# DATOS PARA CENTRO DE MANDO

| Campo | Valor |
|---|---|
| Nombre | La Pizarra |
| Estado | Desplegado en producción, sin uso real confirmado |
| % Avance (alcance V1) | ~90–95% |
| Uso real | No (1 fila de prueba en BD, 0 uso real de equipo) |
| Prioridad técnica | Media |
| Fase | Post-deploy, pre-adopción |
| Próxima acción | Validar login/uso con cuentas reales del equipo (Lili, Joaquín, JoaK) |
| Bloqueado | No |
| Bloqueo | Ninguno técnico — pendiente de adopción |
| URL producción | https://la-pizarra.chefjoak.workers.dev |
| Repo | github.com/JoaK-ve/la-pizarra (público, 1 commit) |
| Base de datos | Supabase compartido con WheelOS (`ejtzoeaqwjktllqvhfsv`) |
| Tests automatizados | No existen |
| Vulnerabilidades (npm audit) | 0 |
| Última actualización relevante | 2026-08-24 (deploy inicial) |
| Confianza del diagnóstico | Alta (técnico) / Baja (uso real) |
