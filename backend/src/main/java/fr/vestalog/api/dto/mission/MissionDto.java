package fr.vestalog.api.dto.mission;

import fr.vestalog.api.entity.Mission;
import fr.vestalog.api.entity.MissionStatus;
import fr.vestalog.api.entity.MissionType;
import fr.vestalog.api.entity.User;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

public record MissionDto(
        UUID id,
        String reference,
        String name,
        MissionType type,
        LocalDate date,
        LocalTime startTime,
        String location,
        MissionStatus status,
        LocalDateTime createdAt,
        UserSummary creator,
        List<UserSummary> participants
) {
    public record UserSummary(UUID id, String firstName, String lastName, String email, String initials) {
        public static UserSummary from(User u) {
            String initials = ("" + u.getFirstName().charAt(0) + u.getLastName().charAt(0)).toUpperCase();
            return new UserSummary(u.getId(), u.getFirstName(), u.getLastName(), u.getEmail(), initials);
        }
    }

    public static MissionDto from(Mission m) {
        return new MissionDto(
                m.getId(), m.getReference(), m.getName(), m.getType(),
                m.getDate(), m.getStartTime(), m.getLocation(), m.getStatus(), m.getCreatedAt(),
                m.getCreator() != null ? UserSummary.from(m.getCreator()) : null,
                m.getParticipants().stream().map(UserSummary::from).toList()
        );
    }
}
