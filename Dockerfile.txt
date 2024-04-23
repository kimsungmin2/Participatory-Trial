FROM node:20.10.0 AS builder
WORKDIR /usr/src/app
COPY package*.json .
# npm ci를 사용하여 의존성을 설치. ci 명령은 package-lock.json이나 npm-shrinkwrap.json을 활용하여
# 더 빠르고 안정적인 의존성 설치를 제공함.
RUN npm ci
# 소스 코드 이미지에 복사함
COPY . .

RUN npm run build

## TypeScript를 JavaScript로 컴파일하는 단계

FROM node:20.10.0

WORKDIR /usr/src/app

COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/package.json ./
# # 서비스 실행을 위한 사용자 생성 및 권한 부여(root 사용자가 애플리케이션 실행 권장 X)
# RUN addgroup -S appgroup && adduser -S appuser -G appgroup
# USER appuser
# 포트 노출
EXPOSE 3000
# 실행 명령
CMD ["npm", "run", "start:dev"]