FROM node:18-alpine

# Install yt-dlp and ffmpeg directly from Alpine packages
RUN apk add --no-cache yt-dlp ffmpeg

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy application files
COPY . .

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]

