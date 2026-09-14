package fr.vestalog.api.dto.lot;

import jakarta.validation.constraints.NotBlank;

public record PochetteRequest(@NotBlank String name, String emoji) {}
