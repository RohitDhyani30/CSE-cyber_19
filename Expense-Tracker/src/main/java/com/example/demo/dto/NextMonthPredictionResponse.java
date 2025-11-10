package com.example.demo.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
public class NextMonthPredictionResponse {

    @JsonProperty("user_id")
    private Integer userId;

    @JsonProperty("predicted_next_month_expense")
    private Double predictedNextMonthExpense;

    @JsonProperty("model_path")
    private String modelPath;

    @JsonProperty("based_on_month")
    private String basedOnMonth;

    // error field used by Java service in fallback
    private String error;

    // No-arg constructor required for Jackson
    public NextMonthPredictionResponse() {}

    // Convenience constructor used in fallback
    public NextMonthPredictionResponse(Integer userId, Double prediction, String error) {
        this.userId = userId;
        this.predictedNextMonthExpense = prediction;
        this.error = error;
    }

    // Getters & Setters
    public Integer getUserId() { return userId; }
    public void setUserId(Integer userId) { this.userId = userId; }

    public Double getPredictedNextMonthExpense() { return predictedNextMonthExpense; }
    public void setPredictedNextMonthExpense(Double predictedNextMonthExpense) { this.predictedNextMonthExpense = predictedNextMonthExpense; }

    public String getModelPath() { return modelPath; }
    public void setModelPath(String modelPath) { this.modelPath = modelPath; }

    public String getBasedOnMonth() { return basedOnMonth; }
    public void setBasedOnMonth(String basedOnMonth) { this.basedOnMonth = basedOnMonth; }

    public String getError() { return error; }
    public void setError(String error) { this.error = error; }
}
