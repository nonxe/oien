FROM node:22-alpine
RUN apk add --no-cache \
    git \
    ffmpeg \
    libwebp-tools \
    python3 \
    make \
    g++
WORKDIR /app
COPY . .
RUN mkdir -p temp
ENV TZ=Asia/Kolkata
RUN npm install
CMD ["npm", "start"]