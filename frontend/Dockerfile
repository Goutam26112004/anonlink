FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY tsconfig.json ./
COPY packages/types/package.json ./packages/types/
COPY packages/types/tsconfig.json ./packages/types/
COPY packages/types/src ./packages/types/src/
COPY frontend/package*.json ./frontend/
RUN npm install

COPY packages/types/ ./packages/types/
COPY frontend/ ./frontend/
ARG NEXT_PUBLIC_BACKEND_URL
ENV NEXT_PUBLIC_BACKEND_URL=$NEXT_PUBLIC_BACKEND_URL
ARG NEXT_PUBLIC_GOOGLE_CLIENT_ID
ENV NEXT_PUBLIC_GOOGLE_CLIENT_ID=$NEXT_PUBLIC_GOOGLE_CLIENT_ID
COPY scripts/validate-env.mjs ./scripts/validate-env.mjs
RUN node scripts/validate-env.mjs
RUN npm run build --workspace=@anon-chat/types
RUN npm run build --workspace=frontend
# Turbopack/webpack leave a persistent build cache (100s of MB, sometimes 1GB+)
# under .next/cache and .next/dev that next start never reads at runtime.
# Strip it so the production image only ships what's actually needed to serve.
RUN rm -rf frontend/.next/cache frontend/.next/dev

FROM node:20-alpine AS runner
WORKDIR /app/frontend
COPY --from=builder /app/frontend/.next ./.next
COPY --from=builder /app/frontend/public ./public
COPY --from=builder /app/frontend/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/types/dist ./node_modules/@anon-chat/types/dist
COPY --from=builder /app/packages/types/package.json ./node_modules/@anon-chat/types/package.json
ENV PORT=3000
ENV NODE_ENV=production
EXPOSE 3000
CMD ["npm", "run", "start"]
