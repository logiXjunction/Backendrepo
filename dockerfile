FROM node:22-alpine

WORKDIR /app

# Copy only package files
COPY package*.json ./

# Install deps
RUN npm install

EXPOSE 3000

# Use nodemon in dev
CMD ["npm", "run", "dev"]
