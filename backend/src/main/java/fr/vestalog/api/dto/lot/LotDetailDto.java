package fr.vestalog.api.dto.lot;

import java.util.List;
import java.util.UUID;

public record LotDetailDto(
        UUID id,
        String internalId,
        String name,
        String description,
        String color,
        boolean active,
        List<SacDetailDto> sacs
) {
    public record ConsumableRef(UUID id, String internalId, String name) {}

    public record ItemDto(UUID id, ConsumableRef consumable, int quantity) {}

    public record PochetteDto(UUID id, String name, String emoji, List<ItemDto> items) {}

    public record SacDetailDto(
            UUID id,
            String label,
            String color,
            List<PochetteDto> pochettes,
            List<ItemDto> directItems
    ) {}
}
