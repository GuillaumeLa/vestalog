package fr.vestalog.api.dto.auth;

public record AuthResponse(String accessToken, UserDto user) {}