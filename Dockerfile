# syntax=docker/dockerfile:1

# ---------- Base: dependencias completas ----------
FROM node:24-alpine AS base
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ---------- Desarrollo: recarga automática con nodemon + tsx ----------
# El código fuente (src/) se monta como volumen desde docker-compose.
FROM base AS dev
ENV NODE_ENV=development
COPY tsconfig.json nodemon.json ./
COPY src ./src
EXPOSE 3000
CMD ["npx", "nodemon", "--legacy-watch", "--watch", "src", "--ext", "ts,json", "--exec", "tsx src/index.ts"]

# ---------- Build: compila TypeScript a dist/ ----------
FROM base AS build
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ---------- Producción: solo dependencias de runtime + dist/ ----------
FROM node:24-alpine AS prod
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /app/dist ./dist
USER node
EXPOSE 3000
CMD ["node", "dist/index.js"]
