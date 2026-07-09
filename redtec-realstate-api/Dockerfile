FROM node:22-alpine

WORKDIR /app

# Instalar dependencias de producción
COPY package*.json ./
RUN npm ci --omit=dev

# Copiar el build compilado (ejecutar "npm run build" antes de docker compose)
COPY dist/ ./dist/

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:${PORT:-3010}/api/health || exit 1

EXPOSE ${PORT:-3010}

CMD ["node", "dist/index.js"]
