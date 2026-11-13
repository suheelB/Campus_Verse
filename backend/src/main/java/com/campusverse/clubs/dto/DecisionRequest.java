package com.campusverse.clubs.dto;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class DecisionRequest {
    @Size(max = 2000)
    private String reason;
}
