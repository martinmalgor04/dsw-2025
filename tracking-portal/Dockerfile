# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install pnpm
RUN npm install -g pnpm

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build the application with default API URL (will be replaced at runtime)
ARG VITE_API_URL=http://operator-interface-service:3004
ENV VITE_API_URL=$VITE_API_URL
RUN pnpm run build

# Ensure public assets are copied (Vite should do this automatically, but let's verify)
RUN if [ ! -f dist/pepacklogo.jpeg ] && [ -f public/pepacklogo.jpeg ]; then \
      cp public/pepacklogo.jpeg dist/pepacklogo.jpeg; \
    fi && \
    echo "=== Build output verification ===" && \
    ls -la dist/ && \
    echo "=== Assets directory ===" && \
    ls -la dist/assets/ 2>/dev/null || echo "No assets directory found" && \
    echo "=== index.html content ===" && \
    head -15 dist/index.html

# Production stage
FROM nginx:alpine

# Install envsubst for runtime variable substitution
RUN apk add --no-cache gettext

# Copy built files to nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy entrypoint script
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 80

ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]

