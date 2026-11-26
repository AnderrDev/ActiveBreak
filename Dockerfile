# Imagen del backend de ActiveBreak (Node.js + TypeScript)
FROM node:24-alpine

WORKDIR /app

# 1. Dependencias (se copian primero para aprovechar la caché de Docker)
COPY package.json package-lock.json ./
RUN npm ci

# 2. Código fuente y compilación de TypeScript a dist/
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# 3. Se quitan las dependencias de desarrollo (typescript, tsx...) para aligerar la imagen
RUN npm prune --omit=dev

ENV NODE_ENV=production
EXPOSE 3000
# Se ejecuta con el usuario "node" (sin privilegios de administrador)
USER node
CMD ["node", "dist/index.js"]
