# Household Budget - 가계부 웹 애플리케이션

Spring Boot + React + PostgreSQL 기반 가계부 웹 애플리케이션

## 기술 스택

### 백엔드
- Spring Boot 3.2.1 (Java 17)
- Spring Data JPA
- Spring Security + JWT
- PostgreSQL
- Flyway Migration
- Lombok
- Gradle 8.5

### 프론트엔드
- React 18 + TypeScript
- Vite
- shadcn/ui
- Tailwind CSS
- React Router

## 프로젝트 구조

```
calc/
├── backend/                    # Spring Boot 백엔드
│   ├── src/main/
│   │   ├── java/com/household/budget/
│   │   └── resources/
│   │       ├── application.properties
│   │       ├── application-dev.properties
│   │       └── application-prod.properties
│   ├── build.gradle
│   └── gradlew
│
└── frontend/                   # React 프론트엔드
    ├── src/
    ├── package.json
    └── vite.config.ts
```

## 실행 방법

### 사전 요구사항
- Java 17+
- Node.js 18+
- PostgreSQL 14+

### 개발 모드 (프론트엔드 + 백엔드 분리)

**1. 백엔드 실행**
```bash
cd backend
./gradlew bootRun
```
- API: http://localhost:8080/api/health

**2. 프론트엔드 실행**
```bash
cd frontend
npm install
npm run dev
```
- URL: http://localhost:3000

### 프로덕션 빌드 (단일 JAR 배포)

프론트엔드와 백엔드를 하나의 JAR 파일로 패키징하여 배포할 수 있습니다.

**1. 프론트엔드 빌드**
```bash
cd frontend
npm install
npm run build
```

**2. 백엔드 빌드 (프론트엔드 포함)**
```bash
cd backend
./gradlew clean bootJar
```

이 과정에서:
- 프론트엔드 빌드 결과물(`frontend/dist`)이 JAR에 포함됩니다
- 만약 프론트엔드가 빌드되지 않았다면 에러 메시지와 함께 빌드가 실패합니다

**3. JAR 실행**
```bash
cd backend/build/libs
java -jar backend-0.0.1-SNAPSHOT.jar
```
- 애플리케이션: http://localhost:8080
- API: http://localhost:8080/api/**

단일 JAR로 프론트엔드와 백엔드를 모두 서빙합니다.

## 배포 아키텍처

### 개발 환경
```
Frontend (localhost:3000) → Vite Dev Server
     ↓ (proxy /api/*)
Backend (localhost:8080) → Spring Boot
```

### 프로덕션 환경
```
Client → http://localhost:8080
         ├─ / → React App (정적 파일)
         └─ /api/** → REST API
```

단일 JAR 파일에 프론트엔드와 백엔드가 모두 포함되어 배포가 간편합니다.
