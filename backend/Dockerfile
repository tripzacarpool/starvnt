# Multi-stage Dockerfile for backend
FROM node:18 AS builder
WORKDIR /app

# Install dependencies and build
COPY package*.json ./
COPY tsconfig*.json ./
COPY src ./src
RUN npm ci
RUN npm run build

FROM node:18
WORKDIR /app

# Only production dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy built artifacts
COPY --from=builder /app/dist ./dist

ENV NODE_ENV=production
EXPOSE 4000

CMD ["node", "dist/src/server.js"]
