FROM node:12-alpine as Build

# TODO run as non root
WORKDIR app/

COPY tsconfig.json package.json package-lock.json ./

RUN npm ci

COPY src ./src/

RUN npm run build
RUN npm prune --production

FROM node:12-alpine

WORKDIR app/

COPY --from=Build /app/node_modules ./node_modules/
COPY --from=Build /app/built ./built/
COPY config.js ./
COPY bin ./bin/

CMD bin/server
