# Household Budget - 가계부 웹 애플리케이션

Spring Boot + React + H2 기반 가계부 웹 애플리케이션

## 기술 스택

### 백엔드
- Spring Boot 3.2.1 (Java 17)
- Spring Data JPA
- H2 Database
- Lombok
- Gradle 8.5

### 프론트엔드
- React 18 + TypeScript
- Vite
- shadcn/ui
- Tailwind CSS

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

### 백엔드
```bash
cd backend
./gradlew bootRun
```
- API: http://localhost:8080/api/health
- H2 Console: http://localhost:8080/h2-console
  - JDBC URL: `jdbc:h2:file:./data/household_budget`
  - Username: `sa`
  - Password: (비워두기)

### 프론트엔드
```bash
cd frontend
npm install
npm run dev
```
- URL: http://localhost:3000

## 빌드

```bash
# Backend
cd backend
./gradlew build

# Frontend
cd frontend
npm run build
```
