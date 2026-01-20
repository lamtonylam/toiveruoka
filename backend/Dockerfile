# Build stage
FROM oven/bun:latest AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN bun install

# Copy source code
COPY . .

# Runtime stage
FROM oven/bun:latest

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN bun install --production

# Copy source code from builder
COPY --from=builder /app/src ./src
COPY --from=builder /app/tsconfig.json ./

EXPOSE 3000

# Run the server
CMD ["bun", "run", "src/index.ts"]
