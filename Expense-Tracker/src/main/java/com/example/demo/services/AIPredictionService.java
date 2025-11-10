package com.example.demo.services;

import com.example.demo.dto.NextMonthPredictionResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AIPredictionService {

    private final RestTemplate restTemplate;

    @Value("${ai.service.url}")
    private String aiServiceUrl;

    @Value("${spring.datasource.url}")
    private String dbUrl;

    @Value("${spring.datasource.username}")
    private String dbUsername;

    @Value("${spring.datasource.password}")
    private String dbPassword;

    /**
     * Calls the Python ML service to get a prediction for a user.
     * @param userId The user's ID
     * @return A DTO with the prediction, or a fallback on error.
     */
    public NextMonthPredictionResponse getPredictionForUser(Integer userId) {

        String dbConnString = buildDbConnString();

        // Python service endpoint (POST)
        String predictUrl = aiServiceUrl;
        if (!predictUrl.endsWith("/")) predictUrl += "/";
        predictUrl += "predict"; // matches python script route

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("user_id", userId);
        requestBody.put("db_conn_string", dbConnString);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        try {
            ResponseEntity<NextMonthPredictionResponse> response = restTemplate.postForEntity(
                    predictUrl,
                    entity,
                    NextMonthPredictionResponse.class
            );

            // if null body, return fallback
            if (response == null || response.getBody() == null) {
                return new NextMonthPredictionResponse(userId, 0.0, "AI service returned empty response");
            }
            return response.getBody();

        } catch (RestClientException e) {
            // Log and return friendly fallback DTO
            System.err.println("Error calling AI prediction service: " + e.getMessage());
            return new NextMonthPredictionResponse(userId, 0.0, "Error: AI service is unavailable");
        }
    }

    /**
     * Build SQLAlchemy connection string from Spring datasource URL.
     * Typical dbUrl: jdbc:postgresql://host:5432/dbname
     * We convert to postgresql://user:pass@host:5432/dbname
     */
    private String buildDbConnString() {
        if (dbUrl == null) return "";

        String url = dbUrl.trim();

        // Remove jdbc: prefix if present
        if (url.startsWith("jdbc:")) {
            url = url.substring(5); // remove "jdbc:"
        }

        // Insert username:password@ after the scheme:// if not present
        // Example before: postgresql://host:5432/db
        // After: postgresql://user:pass@host:5432/db
        try {
            if (url.contains("://") && !url.contains("@")) {
                String[] parts = url.split("://", 2);
                String scheme = parts[0];
                String rest = parts[1];
                // Escape '@' or ':' in username/password if necessary in production
                String credential = dbUsername + ":" + dbPassword;
                url = scheme + "://" + credential + "@" + rest;
            }
        } catch (Exception ex) {
            // Fail-safe: return original (may be acceptable in some setups)
            System.err.println("Warning building DB conn string: " + ex.getMessage());
        }

        return url;
    }
}
