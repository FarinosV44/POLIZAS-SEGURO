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
# pg_dump/pg_restore para las copias (deben ser de la misma versión mayor que el servidor, 16).
RUN apt-get update && apt-get install -y --no-install-recommends postgresql-common ca-certificates \
  && /usr/share/postgresql-common/pgdg/apt.postgresql.org.sh -y && apt-get install -y --no-install-recommends postgresql-client-16 \
  && rm -rf /var/lib/apt/lists/*
RUN useradd --system --uid 1001 app && mkdir -p /datos/documentos /datos/copias && chown -R app /datos
COPY --from=build --chown=app /app /app
USER app
EXPOSE 3000
CMD ["npm", "start"]
