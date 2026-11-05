# Imagen única para la aplicación web y el worker de avisos.
FROM node:22-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 npm ci

FROM deps AS build
COPY . .
RUN npm run build

FROM node:22-bookworm-slim
ENV NODE_ENV=production
WORKDIR /app
RUN useradd --system --uid 1001 app && mkdir -p /datos/documentos && chown -R app /datos
COPY --from=build --chown=app /app /app
USER app
EXPOSE 3000
CMD ["npm", "start"]
