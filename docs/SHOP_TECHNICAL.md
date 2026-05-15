# Tienda — Documentación técnica

Esta guía describe cómo está construida la tienda digital de Madame Ardent, cómo correrla localmente y cómo desplegarla a producción.

## 1. Stack

- **Framework**: Astro 5 en modo SSR (`output: 'server'`)
- **Adapter local / Docker**: `@astrojs/node` (modo `standalone`)
- **Adapter Vercel**: `@astrojs/vercel` (disponible como dependencia; cambiar el adapter en `astro.config.mjs` al desplegar)
- **UI**: TailwindCSS 4 (vía `@tailwindcss/vite`), componentes Astro + islas React 19 para el carrito
- **DB**: PostgreSQL 16 con Prisma 6 ORM
- **Pagos**: Stripe Checkout (modo `payment`) + webhooks
- **Email transaccional**: nodemailer + plantillas React Email
- **Contenido de productos**: Astro Content Collections (`src/content/products/*.md`)
- **Storage de archivos digitales**: filesystem local en `private-files/` (no servido por HTTP). Pluggable: ver §8.

## 2. Estructura de carpetas (relevante para tienda)

```
src/
  content/
    products/               # Markdown frontmatter, uno por producto
  content.config.ts         # Schema Zod de la colección
  components/
    pages/
      ShopIndexPage.astro
      ShopProductPage.astro
      CartPage.astro
      ThankYouPage.astro
    shop/
      ProductCard.astro
      AddToCartButton.tsx   # React island
      CartBadge.tsx
      CartDrawer.tsx
      CartView.tsx
  lib/
    shop/
      cart-store.ts         # Estado del carrito (cliente) con localStorage
      currency.ts           # Currencies, formatPrice, fromCents/toCents
      download-tokens.ts    # Generación de tokens y config TTL/max usos
      file-storage.ts       # Lectura segura desde private-files/
      order-server.ts       # Validación y construcción de orden (server-only, usa astro:content)
      seo.ts                # JSON-LD Product + Offer
      stripe.ts             # Singletons Stripe + URLs públicas
      types.ts              # Tipos compartidos
      use-cart.ts           # Hook React
      use-products.ts       # Hook React
    constants/
      order-status.ts       # Enum y labels
    email.ts                # Envío de emails (incluye sendOrderDeliveryEmail)
    orders-manager.ts       # Cliente del dashboard de pedidos (browser)
  pages/
    tienda/                 # ES: /tienda, /tienda/[slug], /tienda/carrito, /tienda/gracias
    en/shop/                # EN: /en/shop, /en/shop/[slug], /en/shop/cart, /en/shop/thank-you
    dashboard/orders.astro  # Admin de pedidos
    sitemap.xml.ts          # Sitemap dinámico (incluye productos activos)
    api/
      shop/products.ts      # GET listado público
      checkout/session.ts   # POST crea Stripe Checkout Session
      webhooks/stripe.ts    # POST handler de eventos Stripe
      orders/
        index.ts            # POST crea orden pending, GET admin (auth)
        [id].ts             # GET detalle admin
        [id]/resend.ts      # POST reenvía email de entrega
        stats.ts            # GET stats admin
        export.ts           # GET CSV admin
      download/[token].ts   # GET descarga con token (público, auto-expira)
  emails/
    OrderDelivery.tsx       # Plantilla React Email
prisma/
  schema.prisma             # Modelos Order, OrderItem, Download (entre otros)
private-files/products/     # Archivos digitales reales (gitignored)
```

## 3. Modelo de datos

Definido en `prisma/schema.prisma`. Tres modelos involucran la tienda:

### `Order`
| Campo | Tipo | Notas |
|---|---|---|
| `id` | `String` (cuid) | PK |
| `email` | `String` | Email del cliente; se sobrescribe con el de Stripe tras pago |
| `status` | `String` | `pending` \| `paid` \| `delivered` \| `failed` \| `refunded` |
| `currency` | `String` | `EUR` o `USD` |
| `subtotal`, `total` | `Int` | Importes en **centavos** |
| `stripeSessionId` | `String?` | Único; se setea al crear la session |
| `paidAt`, `refundedAt` | `DateTime?` | |
| `createdAt`, `updatedAt` | `DateTime` | |
| Índices | `email`, `status`, `createdAt` | |

### `OrderItem`
Línea de pedido con snapshot del producto en el momento de la compra (`productSlug`, `productTitle`, `unitPrice`, `quantity`, `currency`, `fileKey`). Si `fileKey` es `null`, el item no genera descarga.

### `Download`
Token de descarga por `OrderItem`. Campos: `token` (único, 32 bytes base64url), `expiresAt`, `downloadCount`, `maxDownloads`, `lastUsedAt`. Cada vez que el cliente abre el link, `downloadCount` se incrementa atómicamente.

## 4. Flujo de compra

```
Usuario → /tienda/[slug] → AddToCartButton → cart-store (localStorage)
       → /tienda/carrito → checkout
                            └─► POST /api/orders         (crea Order pending + OrderItems)
                            └─► POST /api/checkout/session (Stripe Session + setea stripeSessionId)
                            └─► redirect Stripe Checkout
                                └─► success → /tienda/gracias?session_id=…
                                └─► cancel  → /tienda/carrito

Stripe → POST /api/webhooks/stripe
        └─► checkout.session.completed:
              ├─ Order: status=paid, paidAt=now, email=customer_email
              ├─ Por cada OrderItem con fileKey: crea Download con token nuevo
              ├─ Envía email de entrega (OrderDelivery)
              └─ Si email OK → status=delivered

Cliente → /api/download/[token] → valida orden pagada, expiración, contador → stream del archivo
```

Validaciones críticas:
- `order-server.ts → validateOrder` reconfirma el precio en el servidor leyendo `src/content/products/*.md` (el cliente nunca decide el precio).
- Currency válida obligatoria (`EUR` o `USD`); el precio se toma de `product.data.price[currency]`.
- Máximo 20 unidades por item, 50 items distintos por orden, email RFC válido.
- En el webhook, la firma se verifica con `STRIPE_WEBHOOK_SECRET`; el body se lee como **raw text** antes de cualquier parseo.

Idempotencia: si el webhook llega dos veces, la segunda corta temprano porque `order.status !== 'pending'`.

## 5. Variables de entorno

| Variable | Obligatoria | Default | Descripción |
|---|---|---|---|
| `DATABASE_PRISMA_DATABASE_URL` | sí | — | Connection string Postgres usada por Prisma Client en runtime |
| `DATABASE_URL` | sí | — | Connection string usada por `prisma migrate` / `db push` (puede ser igual a la anterior) |
| `JWT_SECRET` | sí | — | Firma de tokens JWT del dashboard admin |
| `PUBLIC_SITE_URL` | sí en prod | `http://localhost:4321` | Origen público; se usa para `success_url` / `cancel_url` Stripe, links de descarga, sitemap y OG |
| `STRIPE_SECRET_KEY` | sí | — | `sk_live_…` o `sk_test_…` |
| `STRIPE_WEBHOOK_SECRET` | sí | — | `whsec_…` del endpoint configurado en Stripe |
| `SMTP_HOST` | sí | `smtp.gmail.com` | Host SMTP |
| `SMTP_PORT` | sí | `587` | `465` se asume TLS implícito; otros usan STARTTLS |
| `SMTP_USER` | sí | — | Email remitente |
| `SMTP_PASSWORD` | sí | — | Password o app password (en Gmail usar App Password) |
| `RECIPIENT_EMAIL` | no | — | Destino para notificaciones de formulario de contacto |
| `PRIVATE_FILES_DIR` | no | `private-files/products` | Ruta (relativa a `cwd` o absoluta) donde están los archivos vendibles |
| `DOWNLOAD_EXPIRATION_DAYS` | no | `7` | TTL del token de descarga |
| `DOWNLOAD_MAX_DOWNLOADS` | no | `5` | Máximo de usos por token |
| `PORT` | no | `4321` | Solo para `node ./dist/server/entry.mjs` |
| `TZ` | no | sistema | Recomendado fijar (`Europe/Madrid`) para timestamps coherentes |

> Nota: `astro.config.mjs` declara `envPrefix: ['DATABASE_']`, por lo que el cliente solo puede ver variables que empiecen con ese prefijo. **Ninguna** clave secreta de Stripe/SMTP llega al browser.

Crear un `.env` en la raíz (ya está en `.gitignore`):

```bash
DATABASE_URL="postgresql://madame_ardent:madame_ardent_password@localhost:5432/madame_ardent?schema=public"
DATABASE_PRISMA_DATABASE_URL="postgresql://madame_ardent:madame_ardent_password@localhost:5432/madame_ardent?schema=public"
JWT_SECRET="cambiar-en-prod"
PUBLIC_SITE_URL="http://localhost:4321"
STRIPE_SECRET_KEY="sk_test_…"
STRIPE_WEBHOOK_SECRET="whsec_…"
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="tu@gmail.com"
SMTP_PASSWORD="app-password"
PRIVATE_FILES_DIR="private-files/products"
DOWNLOAD_EXPIRATION_DAYS="7"
DOWNLOAD_MAX_DOWNLOADS="5"
```

## 6. Setup local

### 6.1 Con Docker (recomendado para dev)

```bash
docker compose up -d postgres   # solo la DB
npm install
npx prisma generate
npm run db-upgrade               # aplica el schema actual
npm run dev:db-seed              # crea usuario admin de ejemplo
npm run dev                      # http://localhost:4321
```

Si quieres ejecutar **todo** (web + postgres) dentro de Docker: `docker compose up -d` y la aplicación queda en `http://localhost:4321`. Editar `docker-compose.yml` para añadir variables de Stripe/SMTP antes de levantar.

### 6.2 Sin Docker

Se necesita Postgres 14+ en ejecución y accesible. Crear DB y usuario, definir `DATABASE_URL` / `DATABASE_PRISMA_DATABASE_URL`, y ejecutar los mismos pasos `npm install` → `prisma generate` → `db-upgrade` → `dev:db-seed` → `dev`.

### 6.3 Webhooks de Stripe en local

Stripe no llega a `localhost`. Usar el CLI:

```bash
stripe login
stripe listen --forward-to localhost:4321/api/webhooks/stripe
```

El CLI imprime un `whsec_…` temporal: ponelo en `STRIPE_WEBHOOK_SECRET` y reiniciá `npm run dev`. Para disparar un evento manualmente: `stripe trigger checkout.session.completed`.

Tarjetas de test Stripe: `4242 4242 4242 4242`, cualquier fecha futura, cualquier CVC.

## 7. Comandos relevantes

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo Astro |
| `npm run build` | Build producción (genera `dist/server/entry.mjs`) |
| `npm start` | Corre el build con Node adapter |
| `npm run db-manage` | Abre Prisma Studio (GUI) en `localhost:5555` |
| `npm run db-upgrade` | `prisma db push` — sincroniza schema a la DB (no destructivo) |
| `npm run dev:db-upgrade` | `prisma db push --force-reset` — **destructivo**, borra y recrea |
| `npm run dev:db-seed` | Ejecuta `prisma/seed.ts` |

## 8. Storage de archivos digitales

`src/lib/shop/file-storage.ts` lee archivos desde `PRIVATE_FILES_DIR` (default `private-files/products/`) y los stream-ea con `Content-Disposition: attachment`. Validaciones:

- `fileKey` no puede contener `..`, empezar con `/`, ni incluir nulls
- El path resuelto debe estar dentro del root (anti path-traversal)
- MIME se infiere por extensión; default `application/octet-stream`

**El directorio NO está bajo `public/`** — solo accesible vía `/api/download/[token]` después de validar pago + token + expiración + cuota.

### Cambiar a S3 / R2 / Vercel Blob

`file-storage.ts` exporta `openFileStream()` y `readFileMetadata()`. Para migrar a object storage, reemplazar la implementación interna por el SDK correspondiente y devolver un `ReadableStream` desde el endpoint. El contrato hacia el resto del código no cambia.

## 9. Endpoints API resumen

### Públicos (sin auth)
- `GET /api/shop/products` — listado de productos activos
- `POST /api/orders` — crea orden `pending`
- `POST /api/checkout/session` — crea Stripe Checkout Session, devuelve `url`
- `POST /api/webhooks/stripe` — handler de webhooks (firma obligatoria)
- `GET /api/download/[token]` — descarga del archivo
- `GET /sitemap.xml` — sitemap dinámico con productos activos

### Admin (JWT en `Authorization: Bearer <token>`)
- `GET /api/orders` — listado con filtros (`status`, `currency`, `email`, `dateFrom`, `dateTo`, `sortBy`, `sortOrder`, `page`, `limit`)
- `GET /api/orders/[id]` — detalle con items + downloads
- `POST /api/orders/[id]/resend` — regenera tokens y reenvía email (solo si `status ∈ {paid, delivered}`)
- `GET /api/orders/stats` — KPIs (total, pending, delivered, weekCount, revenue)
- `GET /api/orders/export` — CSV con los mismos filtros que el listado

## 10. SEO y sitemap

- `src/layouts/Layout.astro` acepta props `description`, `ogImage`, `ogType`, `jsonLd` y emite `<meta name="description">`, OpenGraph, Twitter Cards, canonical absoluto y bloques `<script type="application/ld+json">`.
- `src/pages/tienda/[slug].astro` y `src/pages/en/shop/[slug].astro` construyen JSON-LD **Product + Offer** vía `buildProductJsonLd` (`src/lib/shop/seo.ts`) usando precio en EUR (ES) o USD (EN).
- `src/pages/sitemap.xml.ts` es SSR: itera `getCollection('products', { active: true })` y arma URLs para `/tienda/[slug]` y `/en/shop/[slug]` con `xhtml:link rel="alternate" hreflang`.

Validar JSON-LD: <https://search.google.com/test/rich-results>.

## 11. Deploy

### 11.1 Vercel (recomendado para SSR + webhooks)

1. En `astro.config.mjs`, cambiar el adapter:
   ```js
   import vercel from '@astrojs/vercel';
   export default defineConfig({
     adapter: vercel(),
     output: 'server',
     // …resto igual
   });
   ```
2. En Vercel, conectar el repo y configurar todas las variables de §5 en **Project Settings → Environment Variables**.
3. Asegurarse que `PUBLIC_SITE_URL` = dominio de producción (sin trailing slash).
4. Build command: `npm run build`. Output: detectado automáticamente por el adapter.
5. Configurar el webhook de Stripe apuntando a `https://tu-dominio.com/api/webhooks/stripe` con eventos:
   - `checkout.session.completed`
   - `checkout.session.async_payment_failed`
6. Pegar el `whsec_` resultante en la env var `STRIPE_WEBHOOK_SECRET` y redeploy.

> ⚠️ **`PRIVATE_FILES_DIR` en Vercel**: el filesystem es efímero entre invocaciones. Para producción en Vercel hay que migrar a object storage (Vercel Blob, S3, R2). Mientras tanto el endpoint de descarga **fallará** si los archivos no están en la deployment bundle. Ver §8.

### 11.2 Docker / VPS

```bash
docker compose up -d --build
```

Editar `docker-compose.yml` para inyectar todas las variables de §5. Montar el host con `private-files/` como volumen del contenedor para persistencia:

```yaml
services:
  web:
    volumes:
      - ./private-files:/app/private-files
```

Exponer detrás de un reverse proxy (Caddy, nginx) con HTTPS para que Stripe pueda llamar al webhook.

### 11.3 Migraciones de DB en deploy

El proyecto usa `prisma db push` (no migrations explícitas). Para deploy automático:

1. Commit del `schema.prisma` actualizado.
2. En el pipeline / build hook: ejecutar `npx prisma db push` contra la DB de producción **antes** de levantar la app.
3. `prisma generate` debe correrse durante `npm install` (Prisma lo hace solo si está en `postinstall`; verificar) o explícitamente como step.

> Si en algún momento se introducen migrations (`prisma migrate dev` → `prisma migrate deploy`), reemplazar `db push` en producción por `prisma migrate deploy`.

## 12. Seguridad — checklist

- [x] Stripe webhook valida firma con secret separado
- [x] Precio recalculado server-side desde content collection (cliente no decide importes)
- [x] Tokens de descarga 256 bits, expiran y tienen cuota
- [x] Archivos digitales fuera de `public/`, sirven vía endpoint con auth de token
- [x] Path traversal bloqueado en `file-storage.ts`
- [x] Dashboard protegido con JWT (`withAuth` wrapper)
- [x] `Cache-Control: private, no-store` en respuestas de descarga
- [ ] Rate limiting en `/api/checkout/session` y `/api/download/[token]` — **pendiente** (requiere Redis/KV en serverless)
- [ ] Cookie consent banner para EU — pendiente
- [ ] T&C y política de devoluciones publicadas — pendiente

## 13. Logging / observabilidad

Por ahora `console.error` con prefijo `[ruta]`. En Vercel los logs salen automáticos. Para algo serio (Sentry, Logtail) hay que agregar el SDK e inicializarlo en un middleware común — todavía no hecho.

## 14. Troubleshooting frecuente

| Síntoma | Causa probable | Fix |
|---|---|---|
| `"astro:content" module is only available server-side` en el browser | Un archivo cliente importa algo de `*-server.ts` que toca `astro:content` | Mover la función pura a un módulo neutro (ej. `currency.ts`) o re-exportarla desde ahí |
| Webhook devuelve 400 `Invalid signature` | `STRIPE_WEBHOOK_SECRET` no coincide, o el body se parseó como JSON antes de verificar | Verificar secret y no leer `request.json()` antes; el handler ya usa `request.text()` |
| `Stripe did not return a URL` | Cuenta Stripe sin Checkout habilitado o orden con `currency` inválida | Revisar Dashboard de Stripe → Settings → Checkout |
| `File not found` al descargar | `fileKey` del producto no existe en `PRIVATE_FILES_DIR` | Confirmar nombre exacto del archivo y permisos de lectura |
| `Order is not paid yet` (403) | Webhook todavía no llegó / falló | En local: `stripe listen` corriendo; en prod: revisar logs del webhook en Stripe |
| Email de entrega no llega | `SMTP_USER`/`PASSWORD` mal, Gmail bloqueando, o spam | Probar con `swaks` o `nodemailer.verify()`; usar App Password en Gmail |
| Token expiró antes de tiempo | `DOWNLOAD_EXPIRATION_DAYS` mal configurado o reloj del servidor desfasado | Verificar variable y `date` del host |
