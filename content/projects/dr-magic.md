---
title: Dr.Magic
subtitle: DICOM 포맷 변환 AI 서비스
category: Medical Imaging
period: 2026.04 — 현재
role: FE 개발 · 폴스타헬스케어
stack: React 19, TypeScript, pnpm, Vitest, Playwright
metric: 90점대
metricLabel: Lighthouse 주요 성능 지표
order: 1
---
의료 영상 데이터의 복잡한 흐름을 다루는 AI 서비스에서 프론트엔드 구조, 성능, 테스트와 배포 환경을 개선했습니다.

## 서비스 구조와 개발 환경
React 18에서 19로 마이그레이션하고 레거시 의존성을 정리했습니다. 3개 서비스를 모노레포로 통합하고 npm에서 pnpm으로 전환해 서비스별 설정 중복을 줄였습니다.

## 성능과 안정성
Lighthouse 기반 성능 개선으로 주요 성능 지표를 90점대까지 높였습니다. MSW·Vitest·Jest 기반 테스트 환경과 Playwright E2E 테스트를 구축했습니다.

IndexedDB 기반 DICOM 데이터 흐름을 테스트 가능한 형태로 구성해 핵심 기능의 회귀 검증 기반을 마련했습니다.

## 의료 영상과 배포 환경
- OHIF 기반 DICOM Web Viewer를 사내 서비스에 적용하고 커스터마이징했습니다.
- GitHub Actions CI/CD와 Docker·nginx 배포 환경을 정리했습니다.
- 온프레미스 및 폐쇄망 환경을 고려해 외부 CDN 의존성 제거 작업을 진행했습니다.
