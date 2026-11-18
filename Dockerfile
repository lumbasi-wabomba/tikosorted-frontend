FROM node:24-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine-slim AS production
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["sh", "-c", "printf 'globalThis.__APP_CONFIG__ = { backendUrl: \"%s\" };\\n' \"$(printf '%s' \"${VITE_BACKEND_URL:-}\" | sed 's/\\\\/\\\\\\\\/g; s/\"/\\\\\"/g')\" > /usr/share/nginx/html/config.js && exec nginx -g 'daemon off;'"]