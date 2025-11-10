package com.example.demo.controller;

import com.example.demo.dto.NextMonthPredictionResponse;
import com.example.demo.services.AIPredictionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AIPredictionController {

    private final AIPredictionService aiPredictionService;

    /**
     * Endpoint for the frontend to get a prediction for the next month's total expenses.
     * @param userId The ID of the user to predict for.
     * @return A DTO containing the predicted amount.
     */
    @GetMapping("/predict-expense/{userId}")
    public ResponseEntity<NextMonthPredictionResponse> getNextMonthPrediction(@PathVariable Integer userId) {
        try {
            NextMonthPredictionResponse prediction = aiPredictionService.getPredictionForUser(userId);
            // If service returned an error inside DTO, reflect it as 200 but include error message (frontend handles it).
            return ResponseEntity.ok(prediction);
        } catch (Exception ex) {
            // Unexpected error
            NextMonthPredictionResponse fallback = new NextMonthPredictionResponse(userId, 0.0, "Internal error calling prediction service");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(fallback);
        }
    }
}
