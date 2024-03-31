#!/bin/bash

# 의존성 설치
npm install

# PM2로 앱 관리
# 이미 실행 중인 앱이 있으면 삭제
pm2 delete PT || true

# 앱을 PM2로 다시 등록 및 시작
pm2 start npm --name "PT" -- run start

# PM2 설정 저장 (서버 재시작시 앱 자동 시작을 위함)
pm2 save
