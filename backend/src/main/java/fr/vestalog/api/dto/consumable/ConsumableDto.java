package fr.vestalog.api.dto.consumable;

import fr.vestalog.api.entity.Consumable;

import java.util.UUID;

public record ConsumableDto(
        UUID id,
        String internalId,
        String name,
        boolean hasExpiry,
        boolean hasLotNumber
) {
    public static ConsumableDto from(Consumable c) {
        return new ConsumableDto(c.getId(), c.getInternalId(), c.getName(), c.isHasExpiry(), c.isHasLotNumber());
    }
}
