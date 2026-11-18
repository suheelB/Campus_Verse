FROM maven:3.9.6-eclipse-temurin-21 AS maven-builder
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests

FROM eclipse-temurin:21-jre-alpine
RUN addgroup -S campusverse && adduser -S campusverse -G campusverse
WORKDIR /app
COPY --from=maven-builder /app/target/*.jar app.jar
RUN chown -R campusverse:campusverse /app
USER campusverse
EXPOSE 8080
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75", "-jar", "app.jar"]
