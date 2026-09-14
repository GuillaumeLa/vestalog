package fr.vestalog.api.dto.lot;

import jakarta.validation.constraints.NotBlank;

public record LotRequest(
        @NotBlank String name,
        String description,
        String internalId,
        String color,
        boolean active
) {}
