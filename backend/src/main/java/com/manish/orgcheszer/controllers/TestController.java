package com.manish.orgcheszer.controllers;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
@Tag(
        name = "11. Test Controller",
        description = "Endpoints to test whether the backend is running or not"
)
public class TestController {

    @Operation(summary = "Test endpoint")
    @GetMapping("/test")
    public ResponseEntity<Void> test() {
        return ResponseEntity.ok().build();
    }
}