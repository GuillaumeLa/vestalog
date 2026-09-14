package fr.vestalog.api.dto.auth;

public record AuthServiceResult(AuthResponse authResponse, String rawRefreshToken) {}
