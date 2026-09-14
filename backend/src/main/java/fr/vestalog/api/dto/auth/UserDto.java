package fr.vestalog.api.dto.auth;




import fr.vestalog.api.entity.Role;
import fr.vestalog.api.entity.User;

import java.util.UUID;

public record UserDto(
        UUID id,
        String email,
        String firstName,
        String lastName,
        Role role
) {
    public static UserDto from(User user) {
        return new UserDto(user.getId(), user.getEmail(), user.getFirstName(), user.getLastName(), user.getRole());
    }
}