FROM node:20.18-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /usr/src/app
COPY package.json yarn.lock ./
COPY prisma ./prisma
RUN yarn install --frozen-lockfile


FROM node:20.18-alpine AS builder

ENV NODE_ENV=production

WORKDIR /usr/src/app

COPY --from=deps /usr/src/app/node_modules ./node_modules
COPY . .

RUN yarn build

FROM node:20.18-alpine AS runner
WORKDIR /usr/src/app

ENV NODE_ENV=production
ENV PORT=9000

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs

COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/prisma ./prisma
COPY --from=builder /usr/src/app/package.json ./package.json
RUN npx prisma migrate deploy

USER nestjs

EXPOSE 9000

CMD ["node", "dist/src/main"]