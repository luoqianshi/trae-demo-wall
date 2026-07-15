FROM node:18-alpine AS builder

WORKDIR /app

COPY smart-video-analysis-web/package*.json ./

RUN npm ci --quiet

COPY smart-video-analysis-web/. .

RUN npm run build

FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html

COPY smart-video-analysis-web/nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]