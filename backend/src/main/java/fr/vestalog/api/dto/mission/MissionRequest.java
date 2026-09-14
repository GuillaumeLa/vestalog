package fr.vestalog.api.dto.mission;

import fr.vestalog.api.entity.MissionStatus;
import fr.vestalog.api.entity.MissionType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.time.LocalTime;

public record MissionRequest(
        @NotBlank String name,
        @NotNull MissionType type,
        LocalDate date,
        LocalTime startTime,
        String location,
        MissionStatus status
) {}
