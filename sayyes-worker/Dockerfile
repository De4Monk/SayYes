FROM node:20-alpine
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
# Cloud Run сам прокинет переменную PORT (обычно 8080)
EXPOSE 8080
CMD [ "npm", "start" ]
