# Stage 1: Build the workspace
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json ./
COPY packages/types/package*.json ./packages/types/
COPY backend/package*.json ./backend/

RUN npm ci

COPY tsconfig.json ./
COPY packages/types/ ./packages/types/
COPY backend/ ./backend/

RUN npm run build --workspace=packages/types
RUN npm run build --workspace=backend

# Stage 2: Production runner
FROM node:20-alpine AS runner

WORKDIR /usr/src/app

COPY package*.json ./
COPY packages/types/package*.json ./packages/types/
COPY backend/package*.json ./backend/

RUN npm ci --omit=dev

COPY --from=builder /usr/src/app/packages/types/dist ./packages/types/dist
COPY --from=builder /usr/src/app/backend/dist ./backend/dist

EXPOSE 4000

ENV NODE_ENV=production

CMD ["npm", "run", "start", "--workspace=backend"]
