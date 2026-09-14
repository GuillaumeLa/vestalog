package fr.vestalog.api.service;

import fr.vestalog.api.dto.auth.UserDto;
import fr.vestalog.api.entity.Role;
import fr.vestalog.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserAdminService {

    private final UserRepository userRepository;

    public List<UserDto> listAll() {
        return userRepository.findAll().stream().map(UserDto::from).toList();
    }

    @Transactional
    public UserDto updateRole(UUID id, Role role, String callerEmail) {
        var user = userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Utilisateur introuvable"));

        if (user.getEmail().equals(callerEmail)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Vous ne pouvez pas modifier votre propre rôle");
        }

        user.setRole(role);
        return UserDto.from(userRepository.save(user));
    }
}
