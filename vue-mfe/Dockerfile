FROM node:20-alpine AS build
WORKDIR /app

ARG REMOTE_TARGET=props

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build:${REMOTE_TARGET}
RUN if [ "$REMOTE_TARGET" = "window" ]; then cp -r dist-window /output; else cp -r dist /output; fi

FROM nginx:1.27-alpine AS runtime
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /output /usr/share/nginx/html

EXPOSE 80
