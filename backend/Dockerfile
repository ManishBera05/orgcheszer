# Use the lightweight Java 21 Runtime Environment
FROM eclipse-temurin:21-jre-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy the pre-built Spring Boot executable JAR into the container
# We explicitly name it to avoid copying the ".original" file
COPY target/orgcheszer-0.0.1-SNAPSHOT.jar app.jar

# Expose port 8080 for the web server
EXPOSE 8080

# Command to start the application
ENTRYPOINT ["java", "-jar", "app.jar"]