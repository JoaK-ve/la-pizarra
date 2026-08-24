# Roadmap — La Pizarra

Última actualización: 2026-08-24. Basado en `diagnostico-la-pizarra.md` (inspección real del proyecto, no en suposiciones).

## Hecho (V1)

- Login compartido con WheelOS (mismo Supabase Auth, sin registro propio).
- Lista de tareas con filtros por contexto y por persona asignada.
- Crear tarea / marcar como hecha (toggle binario pendiente↔hecho).
- Responsive: FAB en móvil, botón inline en tablet/desktop.
- Deploy en Cloudflare Workers (static assets) con CI/CD por push a GitHub.

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
