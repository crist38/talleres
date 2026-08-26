# ⚙️ Talleres Prowindows – Interfaz de Operario Odoo 19

Aplicación Web Progresiva (PWA) de interfaz simplificada "Factory-First" diseñada para operarios de planta en tablets industriales, 100% integrada con **Odoo 19 Enterprise (SaaS / On-premise)** a través de API JSON-RPC sin necesidad de acceder al backend nativo.

---

## 🎯 Características Principales

* **Diseño Factory-First:** Alto contraste, botones XXL, preparado para tablets industriales táctiles.
* **Sin dependencia de teclado físico:** Teclado numérico táctil integrado (`Numpad`) para registro de unidades producidas y mermas.
* **Formateo inteligente de órdenes:** Oculta códigos redundantes de plantilla (ej. `[TP4+10+4] DVH 4+10+4 (Generico)`) y destaca lo importante para el operario: **Cliente**, **Versión (V1, V2)**, **Dimensiones** y **Especificaciones de Cristales (C1, C2)**.
* **Integración de Cotizaciones:** Visualización directa del número de venta/cotización de origen (ej. `Cotización: S00266`).
* **Cronómetro en Tiempo Real Sincronizado:** Control preciso de **Iniciar**, **Pausar**, **Reanudar** y **Finalizar**, sincronizado con el estado real de Odoo (`is_user_working`).
* **Registro de Mermas/Scrap:** Modal de cierre rápido para confirmar unidades producidas y descontar materiales defectuosos directamente en el módulo de inventarios/scrap de Odoo (`mrp.scrap`).
* **Proxy Express Integrado:** Elimina problemas de CORS sin modificar la configuración Nginx de Odoo.

---

## 📱 Flujo del Operario

```
[ 🔐 Login ] ➔ [ 👷 Operario ] ➔ [ 🏭 Centro de Trabajo ] ➔ [ 📋 Lista de Órdenes ] ➔ [ ⏱ Cronómetro & Cierre ]
```

1. **Login:** Inicio de sesión con Usuario y Contraseña.
2. **Selección de Operario:** Identificación del trabajador en turno (asociado a `hr.employee` en Odoo).
3. **Selección de Estación:** Selección de la mesa o taller. Los talleres PVC se muestran en orden de producción con badge **"Paso N/3"**.
4. **Lista de Órdenes:** Visualización de órdenes de trabajo asignadas a la estación con filtros por estado. En talleres PVC aparece una **barra de navegación** para saltar entre pasos sin volver al menú anterior.
5. **Operación & Cronómetro:** Inicio/Pausa/Reanudación de tiempos y cierre con registro de mermas.

### 🔄 Secuencia PVC (orden fijo de producción)

| Paso | Taller | Badge |
|------|--------|-------|
| 1 | Taller Corte Perfiles PVC | `Paso 1/3` |
| 2 | Taller Corte Armado PVC | `Paso 2/3` |
| 3 | Taller Corte Armado Final PVC | `Paso 3/3` |

La barra de navegación entre talleres (← Anterior · puntos de paso · Siguiente →) aparece automáticamente al estar dentro de cualquier taller de la secuencia PVC.

---

## 🛠️ Requisitos e Instalación

### Requisitos previos
* Node.js v18+ y npm
* Instancia de Odoo 19 con el módulo de Fabricación (`mrp`) activo.
* Usuario de sistema en Odoo (ej. `API_Operarios`) con permisos de Fabricación.

### Configuración del Entorno (`.env`)

Crea un archivo `.env` basado en el archivo `.env.example`:

```env
# URL base de tu Odoo (SaaS u On-Premise)
ODOO_URL=https://prowindows-ltda.odoo.com

# Credenciales de acceso
ODOO_DB=prowindows-ltda
ODOO_USER=api_operarios
ODOO_PASSWORD=tu_contraseña

# Puerto del servidor
PORT=3000

# Variables para desarrollo con Vite
VITE_ODOO_URL=https://prowindows-ltda.odoo.com
VITE_ODOO_DB=prowindows-ltda
VITE_ODOO_USER=api_operarios
VITE_ODOO_PASSWORD=tu_contraseña
```

---

## 🚀 Comandos de Ejecución

### 1. Instalar dependencias
```bash
npm install
```

### 2. Ejecutar en Modo Desarrollo (para Tablets en Red Local)
Expone la aplicación en la red local para poder abrirla desde cualquier tablet conectada al WiFi:
```bash
npm run dev
```
Accede desde la tablet a: `http://[IP-DE-TU-PC]:5173/`

### 3. Compilar y Ejecutar en Producción
```bash
# Compilar frontend
npm run build

# Iniciar servidor Proxy Express + Servir estáticos
npm run serve
```

---

## 📁 Estructura del Código

```text
fabricacion/
├── public/                 # Assets públicos y manifest PWA
├── server.js               # Servidor Proxy Express (CORS workaround)
├── vite.config.js          # Configuración de Vite + PWA Plugin
├── package.json            # Dependencias del proyecto
├── .env.example            # Plantilla de variables de entorno
└── src/
    ├── api/
    │   └── odoo.js         # Capa de comunicación JSON-RPC con Odoo 19
    ├── components/         # Componentes reutilizables (Timer, OrderCard, Topbar, Toast, etc.)
    ├── context/
    │   └── AppContext.jsx  # Estado global (Sesión, Operario, Centro de Trabajo)
    ├── pages/              # Páginas del flujo (Login, OperatorSelect, WorkcenterSelect, OrderList, WorkorderDetail, CloseModal)
    └── utils/
        └── formatters.js   # Formateador de títulos de órdenes (Cliente, Cristales, Cotización)
```

---

## 📄 Licencia

Desarrollado para **Talleres Prowindows**. Todos los derechos reservados.

---

## 📋 Changelog

### v1.4.1 — 2026-08-26
- **[FIX] Las órdenes no avanzaban de taller en Odoo:** `finishWorkorder` solo llamaba a `button_finish` sobre el `mrp.workorder` (cerraba la operación) pero nunca validaba la orden de fabricación (`mrp.production`) padre con `button_mark_done`. Sin esa validación, el semielaborado nunca quedaba disponible como componente para la orden del siguiente taller (Corte Perfiles PVC → Corte Armado PVC → Corte Armado Final PVC), por lo que la orden se veía "finalizada" pero no avanzaba realmente en Odoo. Ahora, al cerrar la última operación pendiente de una orden, se valida automáticamente la producción. Si la validación automática falla (p. ej. requiere un backorder manual), se avisa al operario en pantalla para que la cierre desde Odoo.

### v1.4.0 — 2026-08-25
- **[NUEVO] Secuencia PVC ordenada:** Los talleres *Corte Perfiles PVC → Corte Armado PVC → Corte Armado Final PVC* siempre se muestran en el orden correcto de producción en la pantalla de selección de estación.
- **[NUEVO] Badge "Paso N/3":** Cada tarjeta de taller PVC muestra su número de paso en la esquina superior derecha.
- **[NUEVO] Barra de navegación entre talleres:** Al estar en la lista de órdenes de un taller PVC, aparece una barra con botones ← Anterior y Siguiente → para saltar directamente entre talleres sin volver al menú. Incluye puntos de paso clicables como indicadores de progreso.
- **[INTERNO] `PVC_SEQUENCE`, `getPVCStep`, `sortPVCWorkcenters`:** Tres nuevas exportaciones en `formatters.js` que centralizan la lógica de secuencia PVC. Para cambiar el orden o agregar un paso, solo se edita `PVC_SEQUENCE`.
- **[INTERNO] Lista de workcenters en contexto global:** `AppContext` ahora almacena la lista completa de centros de trabajo para que cualquier pantalla pueda acceder a los talleres adyacentes sin re-fetch.

### v1.3.0 — anterior
- Restricción de acceso por operario: Daniel Pacheco → Termopaneles, Williams → Corte Vidrio, Cristian Tabilo → PVC, Carlos & Cristian → Todos.
- Modal de configuración de credenciales Odoo (`OdooAdminModal`) con prompt automático al recibir `AccessDenied`.
- Corrección de cierre de orden en Odoo 19: uso de `qty_producing` + `button_finish`.
