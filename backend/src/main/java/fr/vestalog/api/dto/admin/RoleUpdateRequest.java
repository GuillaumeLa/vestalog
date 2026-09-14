package fr.vestalog.api.dto.admin;

import fr.vestalog.api.entity.Role;
import jakarta.validation.constraints.NotNull;

public record RoleUpdateRequest(@NotNull Role role) {}
