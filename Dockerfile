FROM node:18 AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
COPY . .
RUN npm run generate && npm run compile

FROM node:18 AS dependencies
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install --only=production

FROM node:18 AS runner
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=dependencies /app/node_modules ./node_modules
COPY ./src/schema.graphql ./dist/

EXPOSE 4000
CMD ["node", "--no-deprecation", "-r", "source-map-support/register", "./dist/index.js"]
