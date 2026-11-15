# Ciko: Railway-ready deployment (React + Express in one container).
FROM node:22-alpine AS frontend-build
WORKDIR /frontend
COPY frontend/package*.json ./
RUN npm ci --no-audit --no-fund
COPY frontend/ ./
RUN npm run build

FROM node:22-alpine AS backend-build
WORKDIR /backend
COPY backend/package*.json ./
RUN npm ci --no-audit --no-fund
COPY backend/tsconfig.json ./
COPY backend/src ./src
RUN npm run build

FROM node:22-alpine
ENV NODE_ENV=production
ENV PORT=4000
ENV FRONTEND_DIR=/app/public
ENV UPLOAD_DIR=/app/uploads
ENV SEED_DEMO=false
WORKDIR /app
COPY backend/package*.json ./
RUN npm ci --omit=dev --no-audit --no-fund
COPY --from=backend-build /backend/dist ./dist
COPY backend/migrations ./migrations
COPY --from=frontend-build /frontend/dist ./public
RUN mkdir -p /app/uploads
EXPOSE 4000
CMD ["sh", "-c", "node dist/utils/migrate.js && node dist/utils/seed.js && node dist/index.js"]
