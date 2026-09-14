package fr.vestalog.api.dto.lot;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record SacItemRequest(@NotNull UUID consumableId, int quantity) {}
