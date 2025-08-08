# Use Node.js 20 Alpine for smaller image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install dependencies for native modules
RUN apk add --no-cache libc6-compat

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy application code (in production)
# In development, we'll use bind mounts instead
COPY . .

# Build the Next.js app (for production)
# RUN npm run build

# Expose port
EXPOSE 3005

# Default command for development
CMD ["npm", "run", "dev"]