FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --no-audit --no-fund
COPY tsconfig.json ./
COPY src ./src
COPY migrations ./migrations
RUN npm run build
RUN mkdir -p uploads
EXPOSE 4000
CMD ["sh","-c","node dist/utils/migrate.js && node dist/utils/seed.js && node dist/index.js"]
