# Dockerfile

FROM node:18.16.0-alpine3.17
RUN mkdir -p /opt/app
WORKDIR /opt/app
COPY package.json package-lock.json ./
RUN npm install
COPY . .
EXPOSE 4000
CMD [ "node", "app.js"]