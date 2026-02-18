# Build Stage
FROM node:20-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production Stage
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Cloud Run requirement: The container must listen on $PORT
# Nginx is configured to listen on 8080 in nginx.conf
EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
