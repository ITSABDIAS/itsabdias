## 1. Arreglos rápidos

**Navbar reordenado (mobile + PC)**
- Reordenar links: Inicio, IA (NEXUS), Proyectos, Tutoriales, Comunidad, **Premium** (destacado con badge dorado), Staff, Mensajes, Perfil.
- En móvil: menú desplegable con scroll, Premium fijado arriba con estilo dorado para que se vea sin hacer scroll.
- Agrupar por secciones ("Explora", "Comunidad", "Mi cuenta") en móvil.

**GitHub de ITSABDIAS**
- Ícono GitHub en Navbar (desktop) y en menú móvil.
- Botón GitHub en el perfil público de ITSABDIAS y en el footer.
- URL: `https://github.com/ITSABDIAS`.

**Fix generador de tutoriales NEXUS**
- Revisar logs de AI Gateway y del server function.
- Causas probables: modelo Gemini 2.5 Flash devolviendo JSON no estricto, falta de `structuredOutputs`, o prompt sin la palabra "json".
- Migrar a `google/gemini-3-flash-preview` con `Output.object` + esquema Zod estricto (title, slug, category, level, content markdown, tags[], excerpt).
- Añadir manejo de errores 402/429 con toast claro.
- Validar slug único antes de insertar (append `-2`, `-3` si colisiona).

## 2. Sistema profesional de permisos

**Nuevas capacidades**
- Enum `staff_action_type`: `assign_admin`, `remove_admin`, `assign_moderator`, `remove_moderator`, `assign_verified`, `remove_verified`, `grant_premium`, `revoke_premium`, `suspend_user`, `unsuspend_user`, `ban_user`, `unban_user`, `mute_user`, `delete_post`, `delete_project`, `delete_tutorial`, `delete_comment`, `feature_post`, `feature_project`, `feature_tutorial`, `hide_content`, `send_announcement`, `send_notification_broadcast`.
- Tabla `user_status`: user_id, status (`active`/`suspended`/`banned`/`muted`), until, reason, set_by.
- Tabla `staff_actions` (historial): actor_id, action, target_user_id, target_content_id, target_content_type, reason, result, created_at. **Sin IP.**
- Tabla `announcements`: title, body, level (info/warn/critical), audience (all/premium/staff), created_by, active, expires_at.

**Funciones SECURITY DEFINER** (validan permisos server-side, nunca confían en frontend):
- `is_founder(uid)`, `is_admin_or_higher(uid)`, `is_moderator_or_higher(uid)`.
- `staff_assign_role(target, role, reason)` — Founder puede todo; Admin solo puede asignar moderator/verified; Mod no puede asignar nada.
- `staff_revoke_role(target, role, reason)` — mismas reglas; nadie puede tocar Founder; Admins no pueden quitar otros Admins.
- `staff_grant_premium(target, reason)` / `staff_revoke_premium(target, reason)` — solo Founder.
- `staff_set_user_status(target, status, until, reason)` — Founder/Admin: suspend/ban; Mod: mute solo.
- `staff_delete_content(type, id, reason)` — con permisos por tipo.
- `staff_feature_content(type, id, featured, reason)` — Admin+.
- `staff_broadcast_notification(title, body, link, audience)` — Founder/Admin.
- `staff_create_announcement(...)` — Founder/Admin.
- Cada función: valida rol del actor, impide auto-asignación, impide tocar Founder, inserta en `staff_actions`, retorna resultado.

**RLS**
- `staff_actions`: SELECT solo para Founder/Admin (Mod ve solo las suyas). INSERT solo vía RPC (revoke direct insert).
- `user_status`: SELECT público de campos no sensibles; UPDATE solo vía RPC.
- `announcements`: SELECT según audience; INSERT/UPDATE/DELETE solo vía RPC.
- `user_roles`: mantener políticas actuales, todas las mutaciones canalizadas por RPC.

**Columnas nuevas en `profiles`**
- `joined_staff_at` (cuándo se convirtió en staff).
- `last_seen_at` (para estado Activo/Inactivo — <5min activo).

## 3. UI

**`/staff` renovado**
- 4 secciones: Founder, Administradores, Moderadores, Verificados.
- Cada tarjeta: avatar, nombre con RankBadge, cargo, fecha de ingreso al staff, última actividad ("Activo ahora" / "hace 2h"), punto verde/gris.

**`/admin` (panel Founder/Admin)**
- Pestañas: Usuarios, Publicaciones, Proyectos, Tutoriales, Tickets, Anuncios, Historial.
- Usuarios: buscar, ver roles, botones (Asignar/Quitar Admin/Mod/Verified/Premium, Suspender, Banear, Mute) — cada uno abre modal pidiendo motivo, llama RPC.
- Botones ocultos según permisos del actor (validación real está en el RPC).
- Historial: tabla filtrable de `staff_actions`.
- Anuncios: crear anuncio global + broadcast de notificación.

**Banner de anuncios** en toda la app (leyendo `announcements` activos según audiencia).

## 4. Detalles técnicos

- Todas las mutaciones desde frontend usan `supabase.rpc(...)` — nunca `update` directo a `user_roles` / `user_status` / `staff_actions`.
- `last_seen_at` se actualiza desde el heartbeat existente (`useRankProgress`).
- Notificaciones automáticas al usuario afectado ("Has sido nombrado Moderador", "Tu cuenta fue suspendida: <motivo>").
- Suspendidos: bloqueo en middleware de posts/comments/tutorials/projects (RPC verifica `user_status`).
- Baneados: no pueden iniciar sesión (trigger en login o check en `_authenticated`).

## 5. Orden de ejecución

1. Migración: enums, tablas, funciones SECURITY DEFINER, RLS, GRANTs.
2. Fix Navbar (mobile-first, Premium visible, GitHub).
3. Fix generador tutoriales (nuevo modelo + structured output).
4. Hooks `useStaffActions`, componentes `StaffActionModal`, `AnnouncementBanner`.
5. Reconstruir `/staff` y `/admin` con nuevas capacidades.
6. Integrar broadcast + status checks en creación de posts/comments.
7. Verificar con browser (Playwright): login, ver menú móvil, generar tutorial, panel admin.

## 6. Fuera de alcance (avisar al usuario)
- No se registra IP (confirmado).
- Restauración de cuentas baneadas: se hace desde el panel Admin (unban).
- Sistema de reportes de contenido: se puede añadir en fase siguiente (ya hay `help_tickets`).