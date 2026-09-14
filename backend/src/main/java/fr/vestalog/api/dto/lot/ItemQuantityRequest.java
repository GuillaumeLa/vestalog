package fr.vestalog.api.dto.lot;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

public record ItemQuantityRequest(@Min(1) @Max(9999) int quantity) {}
