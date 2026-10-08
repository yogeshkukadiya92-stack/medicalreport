FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --include=dev

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package*.json ./
COPY next.config.js next-env.d.ts tsconfig.json postcss.config.js tailwind.config.js ./
COPY public ./public
COPY src ./src
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
# Tesseract resolves its Node worker dynamically, so Next.js standalone tracing
# does not include it automatically. Keep the OCR fallback available at runtime.
COPY --from=builder /app/node_modules/tesseract.js ./node_modules/tesseract.js
COPY --from=builder /app/node_modules/tesseract.js-core ./node_modules/tesseract.js-core
COPY --from=builder /app/node_modules/bmp-js ./node_modules/bmp-js
COPY --from=builder /app/node_modules/idb-keyval ./node_modules/idb-keyval
COPY --from=builder /app/node_modules/is-url ./node_modules/is-url
COPY --from=builder /app/node_modules/node-fetch ./node_modules/node-fetch
COPY --from=builder /app/node_modules/regenerator-runtime ./node_modules/regenerator-runtime
COPY --from=builder /app/node_modules/wasm-feature-detect ./node_modules/wasm-feature-detect
COPY --from=builder /app/node_modules/zlibjs ./node_modules/zlibjs
COPY --from=builder /app/node_modules/whatwg-url ./node_modules/whatwg-url
COPY --from=builder /app/node_modules/tr46 ./node_modules/tr46
COPY --from=builder /app/node_modules/webidl-conversions ./node_modules/webidl-conversions
EXPOSE 3000
CMD ["node", "server.js"]
