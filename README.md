# GitHub Scanner

## Stack

- TypeScript
- GraphQL Appolo Server

## Deploy

### Local

`npm ci`  
Then `npm run dev` OR `npm start`

### Docker

build: `docker build -t graphql-github-scanner-server .`  
run: `docker run --rm -p 4000:4000  graphql-github-scanner-server`