package com.manish.orgcheszer.config;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeIn;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeType;
import io.swagger.v3.oas.annotations.info.Contact;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.security.SecurityScheme;
import org.springframework.context.annotation.Configuration;

@Configuration
@OpenAPIDefinition(
        info = @Info(
                title = "OrgCheszer API",
                description = "REST API for the OrgCheszer FIDE-compliant Chess Tournament Manager.",
                version = "1.0",
                contact = @Contact(name = "Manish", email = "${api.contact.email}")
        )
)
@SecurityScheme(
        name = "bearerAuth",
        description = "JWT auth description. Please insert JWT token",
        scheme = "bearer",
        type = SecuritySchemeType.HTTP,
        bearerFormat = "JWT",
        in = SecuritySchemeIn.HEADER
)
public class OpenApiConfig {
}