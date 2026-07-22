# ---- Build/deps stage (prod deps only) ----
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# ---- Dev deps stage (includes nodemon, used only by the dev target) ----
FROM node:20-alpine AS dev-deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ---- Dev target: used by Skaffold for local iteration ----
# Runs nodemon so that files synced in by Skaffold (see skaffold.yaml) trigger
# an automatic restart inside the running pod — no image rebuild required.
FROM node:20-alpine AS dev
WORKDIR /app
COPY --from=dev-deps /app/node_modules ./node_modules
COPY . .
ENV PORT=3000
EXPOSE 3000
CMD ["npx", "nodemon", "init/server.js"]

# ---- Runtime stage: what actually ships to production ----
FROM node:20-alpine AS runtime
WORKDIR /app

# Run as a non-root user
RUN addgroup -S app && adduser -S app -G app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

USER app
CMD ["node", "init/server.js"]
