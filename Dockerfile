# runmu.sh/docs (mu-docs in the registry): nginx serving a built dist/ under /docs/ with nginx.conf's
# CSP. Caddy on the runmu.sh host routes /docs/* here.
#
# The build happens outside the image (`npm run build && npm run check`, as ci.yml and deploy.yml do)
# because VitePress reads each page's "last updated" date from git history, which a Docker context
# does not have. So:
#   npm ci && npm run build && npm run check
#   docker build -t mu-docs .
#   docker run --rm -p 8080:80 mu-docs      # http://localhost:8080/docs/
FROM nginx:stable-alpine
COPY dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
