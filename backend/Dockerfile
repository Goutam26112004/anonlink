FROM node:20-alpine AS builder
RUN apk add --no-cache openssl
WORKDIR /app
COPY package*.json ./
COPY packages/types/package.json ./packages/types/
COPY packages/types/tsconfig.json ./packages/types/
COPY packages/types/src ./packages/types/src/
COPY backend/package*.json ./backend/
COPY backend/prisma ./backend/prisma/
COPY backend/tsconfig.json ./backend/
RUN npm install

COPY tsconfig.json ./
COPY packages/types/ ./packages/types/
COPY backend/ ./backend/
RUN npm run build --workspace=@anon-chat/types
RUN npx prisma generate --schema=backend/prisma/schema.prisma
RUN npm run build --workspace=@anon-chat/backend

FROM node:20-alpine AS runner
RUN apk add --no-cache openssl
WORKDIR /app
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/backend/prisma ./backend/prisma
COPY --from=builder /app/backend/package.json ./backend/package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/types/dist ./packages/types/dist
COPY --from=builder /app/packages/types/package.json ./packages/types/package.json
EXPOSE 4000
CMD ["node", "backend/dist/index.js"]
