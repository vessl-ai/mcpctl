#!/bin/bash
set -e

# 1. verdaccio 실행 (백그라운드)
pnpm verdaccio &
VERDACCIO_PID=$!
sleep 5 # verdaccio 기동 대기

# 2. npmrc를 로컬 registry로 변경
pnpm exec bash ./scripts/set-local-npmrc.sh

# 3. 모든 패키지 순서대로 publish (no-git-checks, public)
pnpm -r publish --no-git-checks --registry http://localhost:4873

# 4. 테스트 디렉토리에서 실제 설치/동작 테스트
bash ./scripts/test-local-pack-cli.sh
bash ./scripts/test-local-pack-control-plane.sh

# 5. npmrc 원복
pnpm exec bash ./scripts/reset-npmrc.sh

# 6. verdaccio 종료
kill $VERDACCIO_PID 