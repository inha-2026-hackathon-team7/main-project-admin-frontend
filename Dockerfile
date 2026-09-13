# ---- 빌드 스테이지 ----
FROM node:20-alpine AS build
WORKDIR /app

# Vite 는 VITE_ 로 시작하는 값을 빌드 시점에 정적 파일에 그대로 굽습니다.
# 런타임에 바꿀 수 없으므로 반드시 build-arg 로 넘겨주세요:
#   docker build \
#     --build-arg VITE_API_BASE_URL=https://api.example.com \
#     --build-arg VITE_KAKAO_API_KEY=xxxxxxxx \
#     -t region-admin-dashboard .
ARG VITE_API_BASE_URL
ARG VITE_KAKAO_API_KEY
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL} \
    VITE_KAKAO_API_KEY=${VITE_KAKAO_API_KEY}

# 의존성 캐시를 위해 lockfile 먼저 복사 후 설치
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# ---- 실행 스테이지 ----
FROM nginx:1.27-alpine AS runtime

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
