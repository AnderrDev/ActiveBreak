# Backend image of ActiveBreak (Node.js + TypeScript)
FROM node:24-alpine

WORKDIR /app

# 1. Dependencies (copied first to take advantage of the Docker cache)
COPY package.json package-lock.json ./
RUN npm ci

# 2. Source code and TypeScript compilation to dist/
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# 3. Development dependencies (typescript, tsx...) are removed to make the image smaller
RUN npm prune --omit=dev

ENV NODE_ENV=production
EXPOSE 3000
# Runs as the "node" user (without administrator privileges)
USER node
CMD ["node", "dist/index.js"]
