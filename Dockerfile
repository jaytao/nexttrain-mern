# Use the official Node.js 14 image as the base
#FROM node:current-alpine3.17
FROM node:20

# Set the working directory inside the container
WORKDIR /app

# Copy the package.json and package-lock.json files to the working directory
COPY nexttrain/package*.json ./

# Install the project dependencies
RUN npm install

# Copy the application code to the working directory
COPY nexttrain .

# Build the Next.js application
RUN npm run build

# Expose the desired port (e.g., 3000) for the Next.js application
EXPOSE 3000

# Start the Next.js application
CMD [ "npm", "run", "start" ]
