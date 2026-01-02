# 배포 가이드

## 개발 환경 (H2)

현재 프로젝트는 H2 파일 기반 데이터베이스를 사용합니다.

```bash
cd backend
./gradlew bootRun
```

- 데이터 저장 위치: `./data/household_budget.mv.db`
- H2 Console: http://localhost:8080/h2-console

## 운영 환경 (PostgreSQL)

### 1. PostgreSQL 설치
```bash
apt install postgresql postgresql-contrib -y
sudo -u postgres psql

CREATE DATABASE household_budget;
CREATE USER budgetuser WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE household_budget TO budgetuser;
\q
```

### 2. 의존성 변경
`build.gradle` 파일 수정:
```gradle
runtimeOnly 'org.postgresql:postgresql'  // 주석 해제
// runtimeOnly 'com.h2database:h2'      // 주석 처리
```

### 3. 실행
```bash
./gradlew build
java -jar build/libs/household-budget-backend-0.0.1-SNAPSHOT.jar --spring.profiles.active=prod
```

`application-prod.properties`에서 PostgreSQL 접속 정보를 설정하세요.

## Systemd 서비스 등록

```bash
sudo tee /etc/systemd/system/household-budget.service > /dev/null <<EOF
[Unit]
Description=Household Budget Backend
After=postgresql.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/household-budget/backend
ExecStart=/usr/bin/java -jar build/libs/household-budget-backend-0.0.1-SNAPSHOT.jar --spring.profiles.active=prod
Restart=always

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable household-budget
sudo systemctl start household-budget
```
