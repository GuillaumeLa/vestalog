package fr.vestalog.api.dto.auth;

import jakarta.validation.constraints.NotBlank;

public record TokenVerifyRequest(
        @NotBlank String token
) {}