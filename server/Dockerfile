FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache tini

COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

COPY src ./src
COPY sql ./sql

RUN mkdir -p /app/import-logs \
  && chown -R node:node /app

USER node

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8080/health >/dev/null || exit 1

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["npm", "start"]
