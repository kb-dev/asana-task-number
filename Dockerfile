FROM node:lts-alpine

EXPOSE 46537

COPY . /app
WORKDIR /app

RUN npm install
RUN npm install -g pm2

CMD ["pm2-runtime", "index.js"]
