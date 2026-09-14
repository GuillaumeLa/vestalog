package fr.vestalog.api.dto.mission;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record ParticipantRequest(@NotBlank @Email String email) {}
