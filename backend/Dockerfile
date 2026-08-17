# Multi-stage Dockerfile for backend
FROM node:18 AS builder
WORKDIR /app

# Install dependencies and build
COPY package*.json ./
COPY tsconfig*.json ./
COPY src ./src
# `npm ci` requires a lockfile; use plain `npm install` in the builder to support monorepos
RUN npm install
RUN npm run build

FROM node:18
WORKDIR /app

# Only production dependencies
COPY package*.json ./
# Install production dependencies. Use `npm install --production` to avoid failing when no lockfile exists.
RUN npm install --production --no-audit --no-fund

# Copy built artifacts
COPY --from=builder /app/dist ./dist

ENV NODE_ENV=production
EXPOSE 4000

CMD ["node", "dist/src/server.js"]
