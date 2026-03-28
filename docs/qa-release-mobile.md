# QA Operativo de Releases Mobile (Android)

Este documento define el proceso mínimo y obligatorio de QA para releases de Android en Mochi.
Objetivo: reducir regresiones en producción y asegurar que los flujos críticos de estudiantes funcionen en dispositivo real.

## Alcance

- Plataforma: Android (APK de release).
- Entorno principal: producción.
- Cobertura: pre-release y post-release.

## 1) Prerrequisitos de entorno y credenciales

### Entorno técnico

- Equipo QA con Android físico (recomendado Android 12 o superior).
- Espacio libre suficiente para instalar APK y guardar evidencia.
- Conectividad estable a internet (Wi-Fi) y posibilidad de probar sin conexión.
- Acceso al repositorio y al release candidato.
- Acceso a logs básicos (Consola Expo/EAS o logs del dispositivo).

### Credenciales y accesos

- Cuenta de prueba válida para login normal (email/password).
- Cuenta nueva sin datos previos (first-time user).
- Cuenta con datos existentes (usuario recurrente).
- Credenciales de entorno de producción configuradas correctamente en build de release.
- Permisos para consultar panel de Supabase (solo lectura para QA, idealmente).

### Datos y preparación

- Dataset mínimo para pruebas: bloques de estudio, al menos 1 hábito, y datos vacíos para usuario nuevo.
- Checklist de módulos activos esperados para onboarding.
- Versión objetivo documentada (tag o nombre del release).

## 2) Checklist pre-release

Regla general: si un bloque falla, el release no pasa a publicación.

### A. Build gates

Criterio de pase: 100% de checks en verde.

- [ ] Dependencias instaladas con pnpm sin errores.
- [ ] Lint del monorepo sin errores bloqueantes.
- [ ] TypeScript sin errores en mobile.
- [ ] Build de Android release generado correctamente (APK instalable).
- [ ] Variables públicas de Supabase presentes para mobile.
- [ ] Variables públicas de IA (OpenRouter) presentes para mobile.
- [ ] No hay imports rotos ni rutas inexistentes en módulos mobile.

Criterio de fallo:

- Cualquier error de compilación o lint bloqueante.
- APK no instalable en dispositivo real.

### B. Smoke de módulos críticos (pre-publicación)

Criterio de pase: todos los flujos críticos completan sin crash y con estado final correcto.

- [ ] Auth: login con cuenta existente funciona.
- [ ] Auth: logout limpia sesión y no deja navegación protegida accesible.
- [ ] Onboarding: usuario nuevo completa pasos y llega al dashboard.
- [ ] Home: carga inicial sin pantalla en blanco ni error persistente.
- [ ] Estudio: crear bloque de estudio y visualizarlo.
- [ ] Estudio timer: iniciar, pausar, reanudar y completar sesión.
- [ ] Exámenes: registrar nota y verla reflejada en historial/listado.
- [ ] Hábitos: marcar hábito diario y persistir al recargar.
- [ ] Cooking IA: generar receta válida y abrir detalle.
- [ ] Notificaciones: flujo base de permisos no rompe navegación.

Criterio de fallo:

- Crash, bloqueo del flujo, datos no persistidos, o errores silenciosos repetibles.

## 3) Checklist post-release (validación en APK real)

Ejecutar después de publicar el release en GitHub Releases (o canal de distribución definido).

### A. Instalación y arranque

Criterio de pase: instalación limpia y apertura correcta.

- [ ] Descargar APK publicado.
- [ ] Instalar en Android físico sin depender de entorno de desarrollo.
- [ ] Abrir app y verificar versión visible/esperada.
- [ ] Primer arranque sin crash.

Criterio de fallo:

- APK corrupto, error de instalación, crash al abrir.

### B. Login y sesión

Criterio de pase: autenticación estable y navegación segura.

- [ ] Login con credenciales válidas.
- [ ] Error controlado y en español con credenciales inválidas.
- [ ] Cierre de sesión funcional.
- [ ] Reingreso tras cierre de sesión.

Criterio de fallo:

- Sesión inconsistente, mensajes no manejados, o bypass de rutas protegidas.

### C. Onboarding (usuario nuevo)

Criterio de pase: configuración inicial completa sin datos corruptos.

- [ ] Registro/login de cuenta nueva.
- [ ] Selección de módulos en onboarding.
- [ ] Finalización de onboarding y acceso al home.
- [ ] Reapertura de app no repite onboarding si ya está completado.

Criterio de fallo:

- Bucle de onboarding, datos incompletos o bloqueo de navegación.

### D. Estudio timer

Criterio de pase: temporizador funcional y resultados persistidos.

- [ ] Iniciar timer desde flujo de estudio.
- [ ] Pausar/reanudar sin reset involuntario.
- [ ] Completar sesión y verificar impacto en historial.
- [ ] Reabrir app y validar que no quedan estados huérfanos.

Criterio de fallo:

- Pérdida de progreso, duplicados, o sesión marcada sin haberse completado.

### E. Exámenes

Criterio de pase: registro y lectura de notas confiable.

- [ ] Crear registro de examen con datos válidos.
- [ ] Validar campos obligatorios y mensajes de error en español.
- [ ] Ver registro en listado/historial tras guardar.
- [ ] Probar input largo y caracteres especiales (ñ, tildes).

Criterio de fallo:

- Registro no persistido, validaciones ausentes o UI rota.

### F. Hábitos

Criterio de pase: check diario consistente e idempotente.

- [ ] Marcar hábito como completado hoy.
- [ ] Evitar doble suma por doble toque rápido.
- [ ] Verificar estado correcto al refrescar/reabrir app.
- [ ] Probar usuario sin hábitos (empty state correcto).

Criterio de fallo:

- Duplicación de acción, inconsistencia visual, o pérdida de estado.

### G. Cooking IA

Criterio de pase: generación robusta con manejo de errores.

- [ ] Generar receta con prompt simple.
- [ ] Generar receta con texto largo y caracteres especiales.
- [ ] Simular red lenta: loading visible y botón protegido contra doble envío.
- [ ] Simular error IA/respuesta inválida: mensaje claro en español.

Criterio de fallo:

- Pantalla colgada, respuesta mal parseada sin control, o crash.

### H. Notificaciones

Criterio de pase: permisos y funcionamiento base correctos.

- [ ] Solicitud de permiso sin romper flujo.
- [ ] Denegar permiso y verificar fallback estable.
- [ ] Aceptar permiso y comprobar que configuración queda guardada.
- [ ] Abrir app después de cambiar permiso en ajustes del sistema.

Criterio de fallo:

- App dependiente obligatoria de permisos o estados inconsistentes.

## 4) Criterios de pase/fallo por bloque

Usar este estándar para cada bloque del checklist:

- Pase:
  - Flujo completado de extremo a extremo.
  - Sin crash ni freeze.
  - Datos persistidos correctamente.
  - Mensajes de error visibles y en español cuando aplica.
- Fallo:
  - Crash, freeze, o bloqueo de navegación.
  - Corrupción/pérdida de datos.
  - Resultado distinto al esperado de negocio.
  - Error no manejado o sin feedback para usuaria.
- Bloqueante de release:
  - Fallo en auth, onboarding, estudio timer, hábitos, cooking IA, o instalación APK.

## 5) Evidencia mínima a adjuntar

Evidencia obligatoria por release:

- [ ] ID de versión probada (tag/commit/build).
- [ ] Dispositivo(s) y versión de Android usados.
- [ ] Resultado del checklist (pase/fallo por ítem).
- [ ] Captura o video de cada flujo crítico validado:
  - [ ] Instalación y arranque.
  - [ ] Login y logout.
  - [ ] Onboarding completo.
  - [ ] Estudio timer completado.
  - [ ] Registro de examen.
  - [ ] Check de hábito.
  - [ ] Generación de receta IA.
  - [ ] Permisos de notificaciones.
- [ ] Evidencia de error (si hubo): captura, hora aproximada, pasos para reproducir, severidad.

## 6) Rollback y mitigación rápida

Objetivo: reducir impacto a usuarias si se detecta regresión post-release.

### Trigger de rollback

Ejecutar rollback si ocurre alguno:

- Crash en arranque o login para porcentaje relevante de usuarias.
- Fallo general en persistencia de módulos críticos.
- Error severo en cooking IA que bloquea pantalla principal.

### Pasos de mitigación rápida

- [ ] Pausar distribución del release defectuoso.
- [ ] Comunicar incidente internamente (QA + dev + owner) con severidad.
- [ ] Publicar versión previa estable o hotfix prioritario.
- [ ] Validar smoke test mínimo en APK candidato antes de reactivar distribución.
- [ ] Documentar causa raíz y acciones preventivas.

### Checklist de salida de incidente

- [ ] Versión estable nuevamente disponible.
- [ ] Flujos críticos revalidados en dispositivo real.
- [ ] Evidencia anexada al reporte del incidente.
- [ ] Follow-up de mejoras en proceso de QA y release.

## Anexo: plantilla rápida de reporte QA

- Versión:
- Fecha:
- Responsable QA:
- Dispositivo/Android:
- Resultado general: PASA / NO PASA
- Bloqueos detectados:
- Riesgos no bloqueantes:
- Evidencia adjunta:
