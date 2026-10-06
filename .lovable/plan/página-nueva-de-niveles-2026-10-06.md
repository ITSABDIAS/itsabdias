## Página nueva de niveles

### Objetivo

Crear una ruta independiente, `/niveles`, que reúna en un solo lugar el progreso del usuario, las misiones, los 100 niveles, los 50 rangos, las recompensas y el progreso especial del Staff.

### Experiencia de la página

- Cabecera gamer futurista con el nivel actual, rango, EXP, progreso al siguiente nivel y racha diaria.
- Navegación interna clara para **Resumen**, **Misiones**, **Rangos y recompensas** y **Staff**.
- Misiones reales conectadas al progreso existente, con barra, recompensa de EXP y botón para reclamar cuando estén completadas.
- Galería de los 50 rangos y las recompensas de los 100 niveles, diferenciando lo desbloqueado de lo pendiente.
- Área de Staff con nivel, título, barra de EXP y actividades que otorgan EXP de Staff; solo aparecerá para miembros del equipo.
- Diseño compacto en celular y amplio en computadora, manteniendo la estética neón de ItsaBDias.

### Integración

- Añadir **Niveles** al menú de computadora y celular para que la página sea fácil de encontrar.
- Cambiar los accesos de las tarjetas de perfil para llevar a la nueva página.
- Mantener `/bug-hunter` dedicado a reportar errores y al ranking, evitando duplicar allí todo el sistema de niveles.
- Reutilizar el progreso, misiones, recompensas y reglas ya existentes; no cambiar la fórmula de EXP ni los permisos.

### Verificación

- Comprobar que la ruta abre con y sin sesión.
- Probar las pestañas, el reclamo de misiones y la recompensa diaria.
- Revisar el resultado en computadora y celular, además de confirmar que no haya errores.