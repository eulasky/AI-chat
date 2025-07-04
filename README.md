# 🩺 메디마인드 (MediMind)

의약품에 대한 정확하고 안전한 복약 정보를 LLM + RAG 파이프라인을 통해 제공하는 AI 기반 복약 지원 서비스입니다. 사용자는 마음 상담 모드로 변화하여 정서적 안정을 위한 대화를 경험할 수 있습니다.
정부 공인 데이터를 활용하여 병용 금기, 연령별 금기, 임부 금기 등 다양한 정보를 실시간으로 분석하고, 사용자 질문에 맞는 신뢰도 높은 답변을 생성합니다.

---

## 📌 주요 기능

- 약물 간 상호작용 확인 및 경고
- 연령별/임산부 대상 금기 약물 정보 제공
- 복약 상담/마음 상담 모드 변환
- 한국의약품안전관리원 & DUR 데이터 기반 응답
- RAG 파이프라인 기반 LLM 응답 생성
- 정량(RAGAS), 정성(사용자 만족도) 평가 완료

---

## 🛠️ 프로젝트 구성

- drug_safety_service-master: FastAPI 백엔드
- ssafy-chatbot-front-main: Parcel 기반 프론트엔드
- 복약도우미 RAG 파이프라인 구축 보고서.pdf

---

## 👥 팀원 소개

본 프로젝트는 **SSAFY AI 특화 과정** 중 팀 프로젝트로 진행되었습니다.

| 이름 | 역할 | 주요 담당 |
|------|------|-----------|
| 가을하늘 | 팀장 / 백엔드 | FastAPI, RAG 파이프라인, DB 구축, LLM 프롬프트 설계, 평가 지표 정리, Fly.io 배포 |
| 이혜민 | 백엔드 | FastAPI, RAG 파이프라인, DB 구축, LLM 프롬프트 설계, 평가 지표 정리, Fly.io 배포 |
| 정지유 | 프론트엔드 | HTML/CSS/JavaScript(바닐라 JS), Tailwind CSS, Parcel 기반 UI 개발, Vercel 배포, 공공데이터 수집/전처리, IndexedDB 활용 |
| 정하균 | 프론트엔드 | HTML/CSS/JavaScript(바닐라 JS), Tailwind CSS, Parcel 기반 UI 개발, Vercel 배포, 공공데이터 수집/전처리, IndexedDB 활용 |

---

## 🔧 기술 스택

| 구분 | 기술 |
|------|------|
| 프론트엔드 | HTML/CSS/JavaScript (Vanilla JS), Tailwind CSS, Parcel, IndexedDB, Vercel |
| 백엔드 | FastAPI |
| LLM | Upstage Solar Pro |
| Embedding | Upstage Solar Embedding |
| 벡터DB | Pinecone |
| 평가 | RAGAS (Precision 0.87, Recall 0.82 등) |


---

## 🌐 배포 링크

- 백엔드: https://2025-ssafy-drugai-backend-little-surf-2988.fly.dev  
- 프론트: https://ssafy-chatbot-front.vercel.app

---

## 📂 데이터 출처

| 데이터명 | 출처 |
|----------|------|
| 의약품안전사용서비스(DUR) 의약품 목록 | [건강보험심사평가원 (HIRA)](https://www.data.go.kr/data/15127983/fileData.do) |
| 추가 예정 | 식약처 부작용 신고, 해외 FDA/EMA 데이터, 유전자 기반 정보 등 |

---

## 📈 성능 평가 결과

| 항목 | 점수 |
|------|------|
| Context Precision | 0.73 |
| Context Recall | 0.76 |
| 사용자 만족도 | 4.3 / 5.0 |

---

## 🔮 향후 계획

- ✅ 의약품 전체 리스트 DB 제공으로 사용자 선택 편의성 향상
- ✅ 의약품 사진 검색 기능 추가
- ✅ 멀티턴 대화 기능으로 사용자 만족도 증대
- ✅ 맞춤형 복약 캘린더 서비스 제공

---