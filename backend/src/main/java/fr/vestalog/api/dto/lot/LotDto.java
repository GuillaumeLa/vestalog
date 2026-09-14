package fr.vestalog.api.dto.lot;

import fr.vestalog.api.entity.Lot;

import java.util.List;
import java.util.UUID;

public record LotDto(
        UUID id,
        String internalId,
        String name,
        String description,
        String color,
        boolean active,
        List<SacDto> sacs
) {
    public record SacDto(UUID id, String label, String color) {}

    public static LotDto from(Lot lot) {
        return new LotDto(
                lot.getId(),
                lot.getInternalId(),
                lot.getName(),
                lot.getDescription(),
                lot.getColor(),
                lot.isActive(),
                lot.getSacs().stream()
                        .map(s -> new SacDto(s.getId(), s.getLabel(), s.getColor()))
                        .toList()
        );
    }
}
