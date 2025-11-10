package com.example.demo.controller;

import com.example.demo.dto.ReportResponse;
import com.example.demo.services.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor // Automatically injects the service
public class ReportController {

    private final ReportService reportService;

    @GetMapping("/user/{userId}")
    public ResponseEntity<ReportResponse> getReport(
            @PathVariable Integer userId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) List<Integer> categoryIds) {

        ReportResponse report = reportService.generateReport(userId, startDate, endDate, categoryIds);
        return ResponseEntity.ok(report);
    }
}