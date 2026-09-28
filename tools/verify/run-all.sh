#!/usr/bin/env bash
# v61 통합 검증: 정적 점검 → 200단계 엔진 자동 플레이(새치기 거절/수락) → 브라우저 E2E
# 사용법: bash tools/verify/run-all.sh [출력폴더=verify-output]
set -u
cd "$(dirname "$0")/../.."
OUT="${1:-verify-output}"; mkdir -p "$OUT"
fail=0
echo "== 0단계: 정적 점검"; node tools/verify/static-check.mjs > "$OUT/static-check.json" || fail=1; cat "$OUT/static-check.json"
echo "== 1단계: 200단계 자동 플레이 (새치기 거절)"; node tools/verify/headless-campaign.mjs > "$OUT/campaign-decline.json" || fail=1
echo "== 1단계: 200단계 자동 플레이 (새치기 수락)"; node tools/verify/headless-campaign.mjs --accept-cut > "$OUT/campaign-accept.json" || fail=1
node -e 'for(const f of process.argv.slice(1)){const d=require(require("path").resolve(f));console.log(f,JSON.stringify(d.counts));if(d.counts.won!==d.counts.total)process.exitCode=1;}' "$OUT/campaign-decline.json" "$OUT/campaign-accept.json" || fail=1
echo "== 2단계: 브라우저 E2E"; node tools/verify/browser-e2e.cjs "$OUT/e2e" > /dev/null || fail=1
echo "결과: $([ $fail = 0 ] && echo 전체 통과 || echo 실패 항목 있음) → $OUT"
exit $fail
