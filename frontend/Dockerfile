# Simple Dockerfile for React frontend
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Install nginx
RUN apk add --no-cache nginx

# Copy built files to nginx
RUN cp -r dist/* /var/www/localhost/htdocs/

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]