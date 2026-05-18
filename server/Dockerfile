FROM oven/bun:latest

COPY package.json package-lock.json ./

RUN bun install --frozen-lockfile

COPY . .

ENV CLIENT_URL=http://localhost:5173

EXPOSE 3000

CMD ["bun", "run", "start"]
