package fr.vestalog.api.dto.consumable;

import jakarta.validation.constraints.NotBlank;

public record ConsumableRequest(
        @NotBlank String name,
        String internalId,
        boolean hasExpiry,
        boolean hasLotNumber
) {}
