# Web image: the built Angular app served by nginx, which also passes /api, /media,
# /configuration-images to hms-api on the shared Docker network.
FROM node:22-alpine AS build
WORKDIR /web
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npx ng build

FROM nginx:1.27-alpine
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /web/dist/HMS-UI/browser /usr/share/nginx/html
