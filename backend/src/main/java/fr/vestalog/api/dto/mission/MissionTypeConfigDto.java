package fr.vestalog.api.dto.mission;

import fr.vestalog.api.entity.Lot;
import fr.vestalog.api.entity.MissionType;

import java.util.List;
import java.util.UUID;

public record MissionTypeConfigDto(
        String type,
        String label,
        List<LotSummary> lots
) {
    public record LotSummary(UUID id, String internalId, String name, String color) {}

    public static MissionTypeConfigDto from(MissionType type, List<Lot> lots) {
        return new MissionTypeConfigDto(
                type.name(),
                labelFor(type),
                lots.stream()
                        .map(l -> new LotSummary(l.getId(), l.getInternalId(), l.getName(), l.getColor()))
                        .toList()
        );
    }

    private static String labelFor(MissionType type) {
        return switch (type) {
            case DPS       -> "DPS";
            case SAMU_92   -> "SAMU 92";
            case FORMATION -> "Formation";
            case MARAUDE   -> "Maraude";
            case AUTRE     -> "Autre";
        };
    }
}
