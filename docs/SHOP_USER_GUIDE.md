# Tienda — Guía de uso

Esta guía es para quien gestiona el contenido y los pedidos de la tienda, no para desarrolladores. Si necesitas detalles técnicos, consulta `SHOP_TECHNICAL.md`.

## 1. Cómo funciona en una imagen mental

1. Se **crea un producto** añadiendo un archivo Markdown en `src/content/products/` y subiendo el archivo digital correspondiente a `private-files/products/`.
2. El producto aparece **automáticamente** en `/tienda` (español) y `/en/shop` (inglés).
3. Un cliente lo añade al carrito y paga mediante Stripe.
4. Stripe nos avisa, se genera un **enlace de descarga personal** y se envía al cliente por email.
5. El cliente descarga el archivo desde ese enlace, que **expira** en 7 días y permite un máximo de 5 descargas.
6. Toda la actividad queda visible en `/dashboard/orders`.

## 2. Crear un producto nuevo

### 2.1 Estructura mínima

Crear un archivo `.md` dentro de `src/content/products/`. **El nombre del archivo es el slug del producto** (lo que aparece en la URL). Ejemplo: `guia-autopublicacion.md` → `https://madameardent.com/tienda/guia-autopublicacion`.

Plantilla:

```markdown
---
title: "Guía de autopublicación"
shortDescription: "Ebook completo con el proceso paso a paso para autopublicar tu novela sin morir en el intento."
price:
  EUR: 12
  USD: 14
images:
  - /products/guia-autopublicacion-cover.webp
category: "ebooks"
fileKey: "guia-autopublicacion-v1.pdf"
active: true
featured: true
order: 2
seo:
  metaTitle: "Guía de autopublicación | Madame Ardent"
  metaDescription: "El ebook que te lleva del manuscrito a Amazon sin perderte en el camino."
createdAt: 2026-05-05
---

## ¿Para quién es esta guía?

Texto largo, con cualquier formato Markdown: **negrita**, _cursiva_, listas, enlaces, imágenes, lo que se necesite. Este contenido se renderiza en la página de detalle del producto, debajo del precio y el botón "añadir al carrito".
```

### 2.2 Significado de cada campo

| Campo | Obligatorio | Tipo | Qué hace |
|---|---|---|---|
| `title` | sí | texto | Nombre del producto que se muestra en todas partes |
| `shortDescription` | sí | texto | Frase corta debajo del título (1-2 líneas idealmente). También se usa como `meta description` por defecto y en OpenGraph |
| `price.EUR` | sí | número | Precio en euros. Se muestra a usuarios en español por defecto. Acepta decimales (`12.5`) |
| `price.USD` | sí | número | Precio en dólares. Se muestra a usuarios en inglés por defecto |
| `images` | sí | lista | **Al menos una imagen.** Rutas absolutas desde `public/` (ej. `/products/foo.jpg`). La primera se usa como portada y como OG image |
| `category` | sí | texto libre | Para agrupar/filtrar en el futuro. Se recomienda reutilizar siempre las mismas (`ebooks`, `plantillas`, `recursos`, etc.) |
| `fileKey` | no | texto | Nombre exacto del archivo dentro de `private-files/products/`. **Sin este campo el producto puede venderse pero no genera descarga** (útil para productos físicos o servicios) |
| `active` | no (default `true`) | booleano | `false` lo oculta del catálogo y del sitemap, pero conserva los pedidos históricos |
| `featured` | no (default `false`) | booleano | Marcador para destacar en la home / sliders (uso futuro) |
| `order` | no (default `0`) | número | Orden de aparición en el listado. Menor = primero |
| `seo.metaTitle` | no | texto | Override del `<title>`. Si no se define, se construye como `"{title} - Madame Ardent"` |
| `seo.metaDescription` | no | texto | Override de la meta description. Si no se define, se usa `shortDescription` |
| `createdAt` | sí | fecha (`YYYY-MM-DD`) | Fecha de publicación. Se usa en el sitemap como `lastmod` |

### 2.3 Imágenes

- Colocar los archivos en `public/products/` (o donde se prefiera dentro de `public/`).
- Referenciarlas con la ruta absoluta empezando con `/`: `/products/mi-imagen.webp`.
- **Formato recomendado**: WebP con una relación de aspecto aproximada de 4:3 o 1:1, peso < 200 KB.
- La primera imagen se utiliza como portada en el listado y como imagen para redes sociales (Facebook, WhatsApp, Twitter, etc.).

### 2.4 Archivo descargable

Si el producto es digital:

1. Subir el archivo a `private-files/products/`. Este directorio **no es público**, no se puede acceder por URL directa.
2. Anotar el nombre exacto del archivo en `fileKey`.
3. Estructura sugerida para agrupar: `private-files/products/ebooks/guia-autopublicacion-v1.pdf` → `fileKey: "ebooks/guia-autopublicacion-v1.pdf"`.
4. Formatos soportados con MIME correcto: PDF, ZIP, EPUB, MOBI, PNG, JPG, MP3, MP4. Cualquier otro se sirve como `application/octet-stream` (el navegador igualmente lo descarga).

> **Versionar archivos:** cuando salga una versión nueva, subir el archivo con un nombre nuevo (`guia-autopublicacion-v2.pdf`) y actualizar `fileKey`. Los clientes que ya compraron y descargaron seguirán con la v1; si se quiere regenerar tokens con la versión nueva, pulsar "Reenviar email" desde el dashboard (les llegará un enlace nuevo apuntando al `fileKey` actual).

### 2.5 Probar antes de publicar

1. Levantar `npm run dev`.
2. Comprobar en local que el producto se ve correctamente en `/tienda` y en su URL de detalle.
3. Una vez todo correcto, desplegar.

> Mientras se edita un producto, mantener `active: true` para poder previsualizarlo (los productos con `active: false` están filtrados también en local).

## 3. Editar o desactivar un producto

- **Editar texto/precio/imagen**: modificar el `.md` y volver a desplegar. No hay caché agresivo, el cambio aparece de inmediato.
- **Desactivar temporalmente**: poner `active: false`. El producto desaparece del listado y del sitemap, y no puede añadirse al carrito. **Los pedidos históricos y las descargas vigentes siguen funcionando.**
- **Eliminar definitivamente**: borrar el `.md` y el archivo de `private-files/products/`. **No hacerlo si hay pedidos recientes** — los tokens de descarga apuntan al `fileKey` y dejarían de funcionar.

## 4. Gestión de pedidos — `/dashboard/orders`

### 4.1 Acceso

1. Ir a `/login` e iniciar sesión con las credenciales de admin.
2. En la barra lateral, pulsar **"Pedidos"**.

### 4.2 La tabla

Cada fila es un pedido. Las columnas son:

- **Pedido / Email**: ID corto + email del cliente
- **Items**: lista resumida (`2× Guía de autopublicación, 1× Plantillas`)
- **Total**: con formato según la moneda del pedido (€ / $)
- **Estado**: con código de color
- **Fecha**

#### Estados posibles

| Estado | Color | Significa |
|---|---|---|
| Pendiente | amarillo | Se creó el pedido pero el cliente todavía no ha pagado (o canceló antes de pagar) |
| Pagado | azul | Stripe confirmó el pago, los tokens se generaron, pero el email de entrega no llegó a enviarse |
| Entregado | verde | Pagado + email de entrega enviado correctamente |
| Fallido | rojo | El pago asíncrono falló |
| Reembolsado | gris | Reembolso procesado |

### 4.3 Filtros

Encima de la tabla hay 4 filtros que se aplican conjuntamente:

- **Estado**: cualquiera de los anteriores
- **Moneda**: EUR o USD
- **Fecha desde / hasta**: por fecha de creación del pedido

Cambiar cualquier filtro recarga la tabla automáticamente.

### 4.4 Ordenar

Pulsar en las cabeceras **Total**, **Estado** o **Fecha** para ordenar ascendente/descendente. La flecha indica el orden activo.

### 4.5 Stats superiores

Cuatro tarjetas:
- **Total**: cantidad total de pedidos en la base de datos (todos los estados)
- **Pendientes**: cuántos siguen sin pagar
- **Esta semana**: pedidos creados en los últimos 7 días
- **Ingresos del mes**: suma de `total` de pedidos pagados/entregados con `paidAt` en el mes actual, mostrado en EUR

> Nota: si hay ventas en EUR y USD mezcladas, "Ingresos del mes" suma los **céntimos** de ambas y los formatea como EUR. Es un indicador, no contabilidad. Para datos exactos por moneda, exportar CSV.

### 4.6 Ver detalle de un pedido

Pulsar **"Ver detalle"** abre un modal con:

- ID completo, email, estado, moneda
- Subtotal, total, fecha de creación, fecha de pago
- `Stripe Session` (el ID; útil para buscar en el dashboard de Stripe)
- **Items y descargas**: una tarjeta por cada item con:
  - Título y slug del producto
  - Precio unitario × cantidad = total de la línea
  - Si tiene token de descarga vigente: enlace directo `Descargar (n/max) — expira <fecha>`
  - Si el token expiró o se agotó: aviso para reenviar email
  - Si el producto no tiene `fileKey`: "Sin archivo digital"

### 4.7 Reenviar email de entrega

En el modal de detalle, abajo a la derecha: **botón "Reenviar email"**.

Qué hace:
1. Genera tokens de descarga nuevos (los anteriores quedan obsoletos pero no se borran).
2. Envía de nuevo el email de entrega al cliente con los enlaces nuevos.
3. Marca el pedido como `delivered`.

**Cuándo usarlo:**
- El cliente ha perdido el email original.
- Los tokens expiraron y el cliente reclama.
- Se subió una versión nueva del archivo y se quieren regenerar los enlaces de quienes ya compraron.

**Requisitos**: el pedido debe estar en `paid` o `delivered`. Si está pendiente o fallido, el botón aparece deshabilitado.

### 4.8 Exportar CSV

Botón **"Exportar CSV"** arriba a la derecha. Abre un modal con los mismos filtros que la tabla (fecha desde/hasta, estado, moneda) — son opcionales, se puede dejar todo vacío para exportar todo.

El CSV incluye: ID, email, estado, moneda, subtotal, total, items concatenados, Stripe session, fechas de pago/reembolso/creación. Compatible con Excel y Google Sheets.

## 5. Sobre los emails

Los emails se envían desde `SMTP_USER` (definido en variables de entorno). Tipos relacionados con la tienda:

| Cuándo | Asunto | Destinatario |
|---|---|---|
| Tras pago exitoso (webhook Stripe) | `Tu pedido está listo — Madame Ardent` | Cliente |
| Reenvío manual desde el dashboard | `Tu pedido está listo — Madame Ardent` | Cliente |

El contenido incluye: lista de items comprados, total, y un enlace de descarga por cada item digital con su contador de usos restantes y fecha de expiración.

> Si los emails llegan a spam, configurar SPF / DKIM / DMARC en el dominio del remitente. Si se usa Gmail con App Password sin dominio propio, es esperable y conviene migrar a un proveedor como Resend, Postmark o Amazon SES.

## 6. Descargas — cómo funcionan para el cliente

El email contiene enlaces como:
```
https://madameardent.com/api/download/{token}
```

- Cada enlace es **único por cliente y por item**.
- **Expira a los 7 días** desde el momento del pago (configurable mediante variable de entorno).
- **Máximo 5 descargas** por enlace (configurable).
- Si el cliente intenta usarlo tras expirar o agotarse, ve un mensaje claro y puede pedir al admin que reenvíe el email.

## 7. Casos frecuentes

### "Un cliente compró pero no le llegó el email"
1. Buscarlo en `/dashboard/orders` por email.
2. Mirar el estado:
   - **Pendiente**: el pago nunca se confirmó (Stripe no llamó al webhook). Pedir al cliente la captura del cargo y revisar en el Dashboard de Stripe si el pago aparece.
   - **Pagado**: el pago entró pero el email falló al enviarse. Pulsar "Reenviar email" en el detalle.
   - **Entregado**: el email salió. Pedir que revise la carpeta de spam.

### "Quiero cambiar el precio sin afectar a quienes ya compraron"
Modificarlo en el `.md` y desplegar. Los pedidos existentes guardaron el `unitPrice` en `OrderItem` en el momento de la compra — son un snapshot inmutable. Solo afecta a compras nuevas.

### "Quiero ofrecer un producto solo en EUR (o solo en USD)"
A día de hoy el schema exige ambos precios. Solución temporal: poner un precio "razonable" en la moneda que no se usa. Solución correcta: pedir al desarrollador que haga `price` opcional por moneda (cambio de schema en `content.config.ts` + lógica en `order-server.ts`).

### "El cliente quiere cambiar el archivo que descargó"
No se puede modificar el `fileKey` de un pedido histórico desde el dashboard. Opciones:
1. Subir el archivo nuevo a `private-files/products/`.
2. Modificar el `.md` para apuntar al nuevo `fileKey`.
3. Pulsar "Reenviar email" en el pedido → los tokens nuevos apuntarán al `fileKey` actual.

### "Necesito hacer un reembolso"
Se procesa **en el Dashboard de Stripe**, no aquí. Una vez hecho, marcar manualmente el pedido como `refunded` desde Prisma Studio (`npm run db-manage`) o pedir al desarrollador un endpoint para ello. El cliente conserva los tokens de descarga; si se quieren invalidar, borrar los registros `Download` correspondientes.

## 8. Resumen de archivos importantes

| Para modificar… | Archivo |
|---|---|
| Texto de un producto, precio, imágenes | `src/content/products/<slug>.md` |
| Archivo descargable | `private-files/products/...` + actualizar `fileKey` en el `.md` |
| Schema de productos (añadir campos) | `src/content.config.ts` (requiere desarrollador) |
| Diseño de la página de detalle | `src/components/pages/ShopProductPage.astro` |
| Diseño del listado | `src/components/pages/ShopIndexPage.astro` + `src/components/shop/ProductCard.astro` |
| Plantilla del email de entrega | `src/emails/OrderDelivery.tsx` |
| Configuración SMTP, Stripe, descargas | Variables de entorno (ver `SHOP_TECHNICAL.md` §5) |
