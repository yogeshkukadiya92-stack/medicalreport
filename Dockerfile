FROM node:20-alpine AS deps
WORKDIR /app/medivault-web
COPY medivault-web/package*.json ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app/medivault-web
COPY --from=deps /app/medivault-web/node_modules ./node_modules
COPY medivault-web/ ./
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app/medivault-web
ENV NODE_ENV=production
ENV PORT=3000
COPY --from=builder /app/medivault-web/.next/standalone ./
COPY --from=builder /app/medivault-web/.next/static ./.next/static
EXPOSE 3000
CMD ["node", "server.js"]
