FROM node:22-alpine AS frontend-build
WORKDIR /app/lk-partner
COPY lk-partner/package*.json ./
RUN npm install
COPY lk-partner ./
RUN npm run build

FROM node:22-alpine AS backend-runtime
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm install --omit=dev
COPY backend ./
COPY --from=frontend-build /app/lk-partner/build ./public
ENV PORT=3000
EXPOSE 3000
CMD ["node", "app.js"]
