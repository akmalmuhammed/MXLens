# Build the MXLens web app as a standalone image.
# Build from the repository root:  docker build -f apps/web/Dockerfile -t mxlens-web .
FROM node:22-slim AS build
WORKDIR /app
COPY package.json package-lock.json* ./
COPY packages/engine/package.json packages/engine/
COPY packages/cli/package.json packages/cli/
COPY packages/mcp/package.json packages/mcp/
COPY apps/web/package.json apps/web/
RUN npm install --workspaces --include-workspace-root || npm install
COPY . .
RUN npm run build -w @mxlens/engine \
 && NEXT_TELEMETRY_DISABLED=1 npm run build -w @mxlens/web

FROM node:22-slim AS run
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1
COPY --from=build /app ./
EXPOSE 3000
CMD ["npm", "run", "start", "-w", "@mxlens/web"]
