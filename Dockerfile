FROM node:20.18-alpine AS deps
RUN apk add --no-cache libc6-compat openssl
RUN apk add --no-cache libc6-compat

# added for the authentication system
RUN apk add --no-cache libc6-compat openssl python3 make g++ py3-pip
# added for the authentication system
RUN ln -sf /usr/bin/python3 /usr/bin/python && \
    ln -sf /usr/bin/python3 /usr/local/bin/python
# added for the authentication system
ENV PYTHON=/usr/bin/python3

WORKDIR /usr/src/app
COPY package.json yarn.lock ./
COPY prisma ./prisma
RUN yarn install --frozen-lockfile


FROM node:20.18-alpine AS builder

ENV NODE_ENV=production

WORKDIR /usr/src/app

# added for the authentication system
RUN apk add --no-cache libc6-compat openssl python3 make g++ py3-pip

# added for the authentication system
RUN ln -sf /usr/bin/python3 /usr/bin/python && \
    ln -sf /usr/bin/python3 /usr/local/bin/python

COPY --from=deps /usr/src/app/node_modules ./node_modules
COPY . .
# added for the authentication system
RUN python3 --version && npm rebuild bcrypt --build-from-source

RUN yarn build

FROM node:20.18-alpine AS runner
WORKDIR /usr/src/app

RUN apk add --no-cache openssl

ENV NODE_ENV=production
ENV PORT=9000

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs

COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/prisma ./prisma
COPY --from=builder /usr/src/app/src/seeders ./src/seeders
COPY --from=builder /usr/src/app/package.json ./package.json

USER nestjs

EXPOSE 9000

CMD ["sh", "-c", "npx prisma migrate deploy && npx prisma db seed && node dist/src/main"]