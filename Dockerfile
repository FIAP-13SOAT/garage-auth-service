FROM node:24-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install --ignore-scripts
COPY tsconfig.json prisma.config.ts ./
COPY prisma ./prisma
RUN npx prisma generate
COPY src ./src
RUN npm run build

FROM node:24-alpine AS production
WORKDIR /app
ENV NODE_ENV=production \
    DD_SERVICE=garage-auth-service \
    DD_ENV=production \
    DD_VERSION=1.0.0
COPY package*.json ./
COPY prisma.config.ts ./
COPY prisma ./prisma
RUN npm install --omit=dev
COPY --from=builder /app/dist ./dist
EXPOSE 8083
USER node
CMD ["node", "dist/server.js"]
