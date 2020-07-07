FROM node:lts-alpine

EXPOSE 80

COPY . /app
WORKDIR /app

RUN npm install
RUN npm install -g pm2

CMD ["pm2-runtime", "--raw", "ecosystem.config.js"]
