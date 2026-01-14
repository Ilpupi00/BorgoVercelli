# Use Node.js 18 LTS
FROM node:18-alpine

# Install dependencies for native modules (bcrypt, sqlite3)
RUN apk add --no-cache python3 make g++ 

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application files
COPY . .

# Create uploads directory
RUN mkdir -p /data/uploads && \
    mkdir -p public/uploads && \
    mkdir -p src/public/uploads

# Expose port (Railway assigns PORT automatically)
EXPOSE 3000

# Set environment to production
ENV NODE_ENV=production

# Start the application
CMD ["npm", "start"]
