package fr.vestalog.api.dto.mission;

import java.util.List;
import java.util.UUID;

public record MissionTypeConfigRequest(List<UUID> lotIds) {}
