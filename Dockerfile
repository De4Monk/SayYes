# Build Stage
FROM node:20-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

# Build-time variables
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY

# --- DEBUG STEP (Safe Check) ---
# If variable is empty, build will fail.
# We verify if secrets reach Docker.
RUN if [ -z "$VITE_SUPABASE_URL" ]; then echo "❌ ERROR: VITE_SUPABASE_URL is empty at build time!"; exit 1; else echo "✅ VITE_SUPABASE_URL is set (length: $(echo -n $VITE_SUPABASE_URL | wc -c))"; fi

RUN npm run build

# Production Stage
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Cloud Run requirement: The container must listen on $PORT
# Nginx is configured to listen on 8080 in nginx.conf
EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
