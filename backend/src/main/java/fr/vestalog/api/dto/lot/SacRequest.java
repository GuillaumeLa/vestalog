package fr.vestalog.api.dto.lot;

import jakarta.validation.constraints.NotBlank;

public record SacRequest(@NotBlank String label, String color) {}
