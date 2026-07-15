FROM maven:3.9.6-eclipse-temurin-17 AS builder

WORKDIR /app

COPY smart-video-analysis-server/pom.xml .
COPY smart-video-analysis-server/src ./src

RUN mvn clean package -DskipTests -q

FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

COPY --from=builder /app/target/smart-video-analysis-server-*.jar app.jar

RUN mkdir -p /app/logs

EXPOSE 8080

ENV JAVA_OPTS="-Xms256m -Xmx512m"

ENTRYPOINT ["java", "-jar", "app.jar"]