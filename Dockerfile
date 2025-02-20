# Stage 1: Build the Angular app
FROM node:22-alpine AS build-stage

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build:prod

# Stage 2: Serve the app with Nginx
FROM nginx:alpine

COPY --from=build-stage /app/dist/impressaocnat_frontend /usr/share/nginx/html

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]