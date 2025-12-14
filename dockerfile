# Use Node 22
FROM node:22-alpine

# Create app directory
WORKDIR /app

# Copy package files first (for caching)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy rest of the code
COPY . .

# Expose backend port
EXPOSE 3000

# Start server
CMD ["node", "src/index.js"]
