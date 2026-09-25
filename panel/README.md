# 📊 Panel Prowindows – Datos de Odoo 19

Panel web de **solo lectura** para revisar los datos que las apps de Prowindows (talleres y el cotizador Termopanel) dejan en Odoo. No guarda datos propios ni escribe en Odoo: solo consulta con `search_read`.

## Qué muestra

| Pestaña | Modelo Odoo | Filtro de fechas |
|---|---|---|
| Resumen | varios (indicadores) | según cada indicador |
| Ventas | `sale.order` | fecha de la orden |
| Fabricación | `mrp.production` | fecha de inicio |
| Tiempos | `mrp.workorder` (con resumen por taller: esperado vs real) | fecha de inicio |
| Mermas | `mrp.scrap` (con resumen por producto) | fecha de la merma |
| Compras | `purchase.order` | fecha de la orden |

Cada tabla tiene búsqueda, filtro por estado, orden por columna, totales y **Descargar CSV** (separador `;`, abre directo en Excel).

## Acceso

Se ingresa con el **usuario y contraseña de Odoo** de cada persona. Cada uno ve solo lo que sus permisos de Odoo le dejan ver; si un módulo no está instalado o no hay permiso, esa pestaña o indicador lo indica sin romper el resto.

## Uso local

```bash
cd panel
npm install
VITE_ODOO_URL=https://prowindows-ltda.odoo.com VITE_ODOO_DB=prowindows-ltda npm run dev
```

Abre http://localhost:5174. El servidor de Vite reenvía `/web/*` a Odoo para evitar problemas de CORS.

## Publicar en Vercel

Crear un proyecto nuevo en Vercel apuntando a este repositorio con **Root Directory = `panel`**. El `vercel.json` de esta carpeta reenvía `/web/*` a `prowindows-ltda.odoo.com`, igual que la app de talleres. Definir `VITE_ODOO_DB` si la base de datos tiene otro nombre.
