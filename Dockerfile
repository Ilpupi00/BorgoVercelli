# Use Node.js 18 LTS
FROM node:18-alpine

# Install dependencies for native modules (bcrypt only - postgres uses pure JS)
RUN apk add --no-cache python3 make g++

# Set working directory
WORKDIR /app

# Copy package files first for better layer caching
COPY package*.json ./

# Install dependencies (cache this layer when possible)
RUN npm ci --only=production --omit=dev

# Copy application files
COPY . .

# Create uploads directory structure
RUN mkdir -p /data/uploads public/uploads src/public/uploads

# Expose port (Railway assigns PORT automatically)
EXPOSE 3000

# Set environment to production
ENV NODE_ENV=production

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the application
CMD ["npm", "start"]
