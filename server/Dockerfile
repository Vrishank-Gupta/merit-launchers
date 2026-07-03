FROM node:20-trixie-slim

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    tini \
    wget \
    imagemagick \
    libwmf-bin \
    librsvg2-bin \
    emf2svg \
    fontconfig \
    fonts-liberation \
    fonts-dejavu-core \
    fonts-noto-core \
    fonts-noto-extra \
    fonts-urw-base35 \
  && rm -rf /var/lib/apt/lists/*
COPY fontconfig/local.conf /etc/fonts/local.conf
RUN fc-cache -f

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

ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["node", "src/index.js"]
