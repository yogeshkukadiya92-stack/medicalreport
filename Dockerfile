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
COPY --from=builder /app/medivault-web/public ./public
# OCR's worker loads these modules dynamically at runtime.
COPY --from=builder /app/medivault-web/node_modules/tesseract.js ./node_modules/tesseract.js
COPY --from=builder /app/medivault-web/node_modules/tesseract.js-core ./node_modules/tesseract.js-core
COPY --from=builder /app/medivault-web/node_modules/@tesseract.js-data/eng ./node_modules/@tesseract.js-data/eng
COPY --from=builder /app/medivault-web/node_modules/bmp-js ./node_modules/bmp-js
COPY --from=builder /app/medivault-web/node_modules/idb-keyval ./node_modules/idb-keyval
COPY --from=builder /app/medivault-web/node_modules/is-url ./node_modules/is-url
COPY --from=builder /app/medivault-web/node_modules/node-fetch ./node_modules/node-fetch
COPY --from=builder /app/medivault-web/node_modules/regenerator-runtime ./node_modules/regenerator-runtime
COPY --from=builder /app/medivault-web/node_modules/wasm-feature-detect ./node_modules/wasm-feature-detect
COPY --from=builder /app/medivault-web/node_modules/zlibjs ./node_modules/zlibjs
COPY --from=builder /app/medivault-web/node_modules/whatwg-url ./node_modules/whatwg-url
COPY --from=builder /app/medivault-web/node_modules/tr46 ./node_modules/tr46
COPY --from=builder /app/medivault-web/node_modules/webidl-conversions ./node_modules/webidl-conversions
EXPOSE 3000
CMD ["node", "server.js"]
