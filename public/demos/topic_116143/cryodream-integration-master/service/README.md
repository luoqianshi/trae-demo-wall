# Spring Boot Template

[![Java](https://img.shields.io/badge/Java-17-orange.svg)](https://www.oracle.com/java/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-2.7.x-brightgreen.svg)](https://spring.io/projects/spring-boot)
[![MyBatis Plus](https://img.shields.io/badge/MyBatis%20Plus-3.5.2-blue.svg)](https://baomidou.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

A production-ready Spring Boot project template with essential features and best practices for rapid backend development.

[中文文档](docs/README-zh.md)

---

## Application Scenarios

This template is designed for:

- **Blog / Content Platform** - Post management, like & favorite system, full-text search
- **User Management System** - Registration, login, role-based access control, profile management
- **API Backend Service** - RESTful API with JWT/Session dual authentication, API documentation
- **Quick Project Bootstrap** - Standardized project structure, code generator, multi-environment config
- **Learning & Reference** - Best practices for Spring Boot, MyBatis Plus, AOP, exception handling

---

## Architecture

![System Architecture](docs/系统架构图与技术栈.png)

---

## Quick Start

### Prerequisites

- JDK 17+
- Maven 3.6+
- Docker & Docker Compose (recommended)

### Option 1: Docker One-Click Deploy (Recommended)

```bash
# 1. Clone the repository
git clone <repository-url>
cd springboot-init

# 2. Copy environment file (optional)
cp .env.example .env

# 3. Start all services
docker-compose up -d
```

That's it! The application will be available at:
```
http://localhost:8111
API Documentation: http://localhost:8111/api/doc.html
```

**What Docker does automatically:**
- Starts MySQL 8.0 and initializes database with tables
- Creates default admin account (`admin` / `admin123`)
- Starts Redis 7 for caching
- Builds and runs the Spring Boot application
- Configures network and environment variables

**Common commands:**
```bash
# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Stop and remove data volumes
docker-compose down -v

# Rebuild after code changes
docker-compose up -d --build
```

### Option 2: Manual Setup

#### 2.1 Database Setup

Execute the SQL script:

```bash
mysql -u root -p < sql/create_table.sql
```

Default admin account:
- **Username:** `admin`
- **Password:** `admin123`

#### 2.2 Configuration

Edit `src/main/resources/application.yml`:

```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/my_db
    username: root
    password: your_password
```

#### 2.3 Build & Run

```bash
mvn clean package -DskipTests
mvn spring-boot:run
```

#### 2.4 Access API Documentation

```
http://localhost:8111/api/doc.html
```

---

## Docker Configuration

### docker-compose.yml

The project includes a complete Docker orchestration file with three services:

| Service | Image | Port | Description |
|---------|-------|------|-------------|
| mysql | mysql:8.0 | 3306 | Primary database, auto-init on first run |
| redis | redis:7-alpine | 6379 | Cache & session storage |
| app | Built from Dockerfile | 8111 | Spring Boot application |

### .env Configuration

Copy `.env.example` to `.env` and customize:

```env
# MySQL
MYSQL_ROOT_PASSWORD=root123
MYSQL_DATABASE=my_db
MYSQL_PORT=3306

# Redis
REDIS_PORT=6379

# Application
APP_PORT=8111

# JWT
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRATION=2592000
```

### Dockerfile

Multi-stage build for optimized image size:

```dockerfile
# Stage 1: Build
FROM maven:3.8.7-eclipse-temurin-17-alpine AS builder
RUN mvn package -DskipTests

# Stage 2: Run
FROM eclipse-temurin:17-jre-alpine
COPY --from=builder /app/target/*.jar app.jar
```

### Production Deployment

For production, consider:

```yaml
# docker-compose.prod.yml
services:
  app:
    environment:
      SPRING_PROFILES_ACTIVE: prod
    deploy:
      replicas: 2
      resources:
        limits:
          memory: 512M
```

```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

---

## Project Structure

```
springboot-init/
├── src/main/java/com/ice/template/
│   ├── annotation/          # Custom annotations
│   ├── aop/                 # Aspect implementations
│   ├── common/              # Common classes
│   ├── config/              # Configuration classes
│   ├── controller/          # REST controllers
│   ├── exception/           # Exception handling
│   ├── mapper/              # MyBatis mappers
│   ├── model/               # Data models (DTO/VO/Entity)
│   ├── service/             # Business logic
│   └── utils/               # Utility classes
├── sql/                     # Database scripts
├── docker-compose.yml       # Docker orchestration
├── Dockerfile               # Application image
└── .env.example             # Environment template
```

---

## API Examples

### User Login

```bash
POST /api/user/login
Content-Type: application/json

{
  "userAccount": "admin",
  "userPassword": "admin123"
}
```

**Response:**
```json
{
  "code": 0,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "id": 1,
    "userName": "管理员",
    "userRole": "admin"
  },
  "message": "ok"
}
```

### Authentication

This project supports dual authentication:

**Session + Cookie (Browser):**
```bash
curl -X POST http://localhost:8111/api/user/login \
  -H "Content-Type: application/json" \
  -d '{"userAccount":"admin","userPassword":"admin123"}' \
  -c cookies.txt
```

**JWT Token (Mobile/API):**
```bash
curl -X GET http://localhost:8111/api/user/get/login \
  -H "Authorization: Bearer {token}"
```

---

## Development

### Code Generator

Use `CodeGenerator` class to auto-generate boilerplate code for new modules.

### Running Tests

```bash
mvn test
```

### Building for Production

```bash
mvn clean package -DskipTests
java -jar target/template-0.0.1-SNAPSHOT.jar
```

---

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -m 'feat: add your feature'`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a Pull Request

---

## License

MIT License - see the [LICENSE](LICENSE) file for details.

---

## Acknowledgments

- [Spring Boot](https://spring.io/projects/spring-boot)
- [MyBatis Plus](https://baomidou.com/)
- [Knife4j](https://doc.xiaominfo.com/)
- [Hutool](https://hutool.cn/)
- [liyupi](https://github.com/liyupi) - Original project inspiration
