[English](QA_MANUAL.md) | [Español](QA_MANUAL.es.md)

# 📋 Lista de verificación de revisión manual de QA

Antes de declarar cualquier versión como "estable para producción", use esta lista de verificación para la revisión humana.

## 👥 Clientes y Conversaciones
- [ ] **Action Hub**: Haga clic en el menú, mueva el cursor alrededor. 
  - *Esperado*: El menú permanece abierto hasta que se hace clic en una opción o se hace clic fuera.
- [ ] **Búsqueda en la barra lateral**: Escriba un nombre, espere los resultados.
  - *Esperado*: Cero lag, los resultados se filtran correctamente.

## ⚙️ Configuración de Administración
- [ ] **SnapshotsTab → Hover**: Pase el cursor sobre las filas de instantáneas.
  - *Esperado*: Los botones Editar/Renombrar/Eliminar son visibles (40% base, 100% hover), receptivos y no causan saltos de diseño.
- [ ] **BrandingTab → Precisión**: Cambie rápidamente entre colores primarios.
  - *Esperado*: Transición suave, sin parpadeos, la vista previa se actualiza en tiempo real.

## 💻 Panel de control y diseño
- [ ] **Estado del espacio de trabajo**: Mueva ventanas, actualice la página.
  - *Esperado*: El diseño se restaura exactamente como estaba antes; no hay desincronización entre el navegador y el servidor.
- [ ] **Modo de enfoque**: Alterne entre Lienzo y Enfoque.
  - *Esperado*: La animación es fluida, el contenido se escala adecuadamente.

## 📁 Exportaciones y Archivos
- [ ] **Exportación PDF**: Haga clic en "Exportar" en un pedido o chat (si está disponible).
  - *Esperado*: Comienza la descarga del archivo real; sin alertas de marcadores de posición ni enlaces rotos.

---
## ⚡ Comprobación de cordura de implementación de 5 minutos
Antes de presionar "Implementar", realice esta "Comprobación de cordura" manual de 5 minutos:

| Tarea | Objetivo |
| :--- | :--- |
| **Comprobación visual** | Abra la pestaña de Branding; cambie el tamaño del navegador a anchos de "móvil" y "tableta". |
| **Comprobación de consola** | Abra DevTools; haga clic en "Ver registro de actividad". ¿Hay errores rojos? |
| **Comprobación de autenticación** | Cierre la sesión y vuelva a iniciarla. (El fallo "silencioso" más común). |
| **Comprobación de Sembrado** | Ejecute `python server/seed_config.py` y verifique los datos de muestra en el Chat. |

## 🛡️ Reglas de seguridad de Senior QA

1. **Dominar la actualización de la "Línea base"**: Si la CI falla en una diferencia visual, verifique manualmente con `npx playwright show-report`. Si es correcto, ejecute `npx playwright test --update-snapshots` y confirme las nuevas imágenes.
2. **Protegerse contra pruebas "Inestables"**: Nunca use tiempos de espera codificados. Use `locator.waitFor()` o expectativas de estado sólidas. Si una prueba falla una vez pero pasa en un reintento, corrija la condición de carrera inmediatamente.
3. **Comprobación del "Espejo de producción"**: Asegúrese de que `baseURL` en `playwright.config.ts` coincida con el entorno de destino (Staging/Prod) antes del cierre final.

---
## 🤖 Suite de Pruebas Automatizadas
Nueva suite de pruebas completa para la verificación del backend y el frontend.

### 1. Pruebas de Integración del Backend
Ejecute estos scripts para verificar la lógica de la API central, la integridad de la base de datos y los flujos de IA.
```bash
# Verificar Auth, Productos, Clientes, Pedidos
python test_products.py && python test_clients.py && python test_orders.py

# Verificar el Webhook de WhatsApp y el Bucle de Respuesta de IA
python test_chat_flow.py
```

### 2. Pruebas E2E del Frontend (Playwright)
Ejecute la suite de verificación completa basada en el navegador.
```bash
cd client
# Use --workers=1 para la estabilidad de SQLite en entornos locales/CI
npx playwright test --grep @stable --workers=1
```

### 3. Mantenimiento de la Base de Datos (Docker)
Si encuentra errores de esquema, use estos scripts dentro del contenedor:
```bash
# Restablecer contraseña de administrador
docker compose exec backend python reset_admin_docker.py

# Comprobar esquemas de BD
docker compose exec backend python check_tables.py
docker compose exec backend python check_columns.py
```

---
*Última actualización: 2026-02-06*
