FROM node:20-alpine AS build
WORKDIR /app

ARG MFE_NAME=mfe1

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build:${MFE_NAME}

FROM nginx:1.27-alpine AS runtime
ARG MFE_NAME=mfe1
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/${MFE_NAME}/browser /usr/share/nginx/html

EXPOSE 80
