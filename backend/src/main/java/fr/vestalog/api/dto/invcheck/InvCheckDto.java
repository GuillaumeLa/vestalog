package fr.vestalog.api.dto.invcheck;

import fr.vestalog.api.entity.InvCheckStatus;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record InvCheckDto(
        UUID id,
        UUID missionId,
        String missionName,
        InvCheckStatus status,
        LocalDateTime startedAt,
        LocalDateTime completedAt,
        int totalItems,
        int checkedItems,
        List<LotCheckDto> lots
) {

    public record LotCheckDto(
            UUID lotId,
            String name,
            String color,
            int totalItems,
            int checkedItems,
            List<SacCheckDto> sacs
    ) {}

    public record SacCheckDto(
            UUID sacId,
            String label,
            String color,
            List<ItemCheckDto> directItems,
            List<PochetteCheckDto> pochettes
    ) {}

    public record PochetteCheckDto(
            UUID pochetteId,
            String name,
            String emoji,
            List<ItemCheckDto> items
    ) {}

    public record ItemCheckDto(
            UUID invCheckItemId,
            String consumableName,
            boolean hasExpiry,
            boolean hasLotNumber,
            int quantity,
            boolean checked,
            String checkedByName,
            LocalDateTime checkedAt
    ) {}
}
