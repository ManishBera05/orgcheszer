package com.manish.orgcheszer.controllers;

import com.manish.orgcheszer.dtos.PlatformStatsDTO;
import com.manish.orgcheszer.services.PlatformStatsService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/stats")
@RequiredArgsConstructor
@Tag(name = "9. Gets live stats",
        description = "Public endpoint to get the live statistics of the API")
public class PlatformStatsController {

    private final PlatformStatsService platformStatsService;

    @GetMapping
    public ResponseEntity<PlatformStatsDTO> getStats() {
        return ResponseEntity.ok(platformStatsService.getStats());
    }
}