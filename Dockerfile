FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci --legacy-peer-deps

COPY . .

RUN mkdir -p prisma && echo "" > prisma/prod.db

ENV DATABASE_URL="file:./prisma/prod.db"

RUN npx prisma generate

RUN npm run build

EXPOSE 5001

CMD ["npm", "start"]