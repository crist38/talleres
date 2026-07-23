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
3. **Selección de Estación:** Selección de la mesa o taller (ej. *Taller Corte Vidrio*, *Taller Termopaneles*, *TALLER DE PVC*).
4. **Lista de Órdenes:** Visualización de órdenes de trabajo asignadas a la estación con filtros por estado.
5. **Operación & Cronómetro:** Inicio/Pausa/Reanudación de tiempos y cierre con registro de mermas.

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
