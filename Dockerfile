FROM node:20-alpine AS build

WORKDIR /app

# Instalar dependencias del sistema necesarias para Prisma
RUN apk add --no-cache openssl openssl-dev

COPY package*.json ./
COPY prisma ./prisma/

RUN npm install --production=false

COPY . .

RUN npx prisma generate

RUN npm run build

FROM node:20-alpine

WORKDIR /app

# Instalar OpenSSL 1.1 compatibility para Prisma
RUN apk add --no-cache \
    openssl \
    libc6-compat

# Copiar los archivos necesarios para producción
COPY --from=build /app/dist ./dist
COPY --from=build /app/package*.json ./
COPY --from=build /app/prisma ./prisma/
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/node_modules/@prisma ./node_modules/@prisma

RUN npm install --production

RUN npx prisma generate

# Crear usuario no-root para seguridad
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

RUN chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 4321

ENV HOST=0.0.0.0
ENV PORT=4321
ENV NODE_ENV=production

CMD ["node", "./dist/server/entry.mjs"]
