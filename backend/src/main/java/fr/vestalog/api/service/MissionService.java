package fr.vestalog.api.service;

import fr.vestalog.api.dto.mission.MissionDto;
import fr.vestalog.api.dto.mission.MissionRequest;
import fr.vestalog.api.entity.Mission;
import fr.vestalog.api.entity.MissionStatus;
import fr.vestalog.api.entity.Role;
import fr.vestalog.api.entity.User;
import fr.vestalog.api.repository.InvCheckItemRepository;
import fr.vestalog.api.repository.InvCheckRepository;
import fr.vestalog.api.repository.MissionRepository;
import fr.vestalog.api.repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class MissionService {
    private final MissionRepository missionRepository;
    private final UserRepository userRepository;
    private final JdbcTemplate jdbcTemplate;
    private final InvCheckRepository invCheckRepository;
    private final InvCheckItemRepository invCheckItemRepository;

    public List<MissionDto> getAll(Authentication auth) {
        if (isAdmin(auth)) {
            return missionRepository.findAllByOrderByCreatedAtDesc()
                    .stream().map(MissionDto::from).toList();
        }
        return missionRepository.findAllVisibleToUser(auth.getName())
                .stream().map(MissionDto::from).toList();
    }

    public MissionDto getDetail(UUID id, Authentication auth) {
        Mission mission = missionRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Mission introuvable"));
        if (!isAdmin(auth) && !isVisible(mission, auth.getName())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Accès refusé");
        }
        return MissionDto.from(mission);
    }

    @Transactional
    public MissionDto create(MissionRequest req, Authentication auth) {
        jdbcTemplate.execute("SELECT pg_advisory_xact_lock(1001)");
        int seq = missionRepository.findMaxSeq() + 1;
        String reference = "#M-%03d".formatted(seq);

        User creator = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Utilisateur introuvable"));

        Mission mission = Mission.builder()
                .reference(reference)
                .name(req.name())
                .type(req.type())
                .date(req.date())
                .startTime(req.startTime())
                .location(req.location())
                .status(req.status() != null ? req.status() : MissionStatus.EN_COURS)
                .creator(creator)
                .build();

        return MissionDto.from(missionRepository.save(mission));
    }

    @Transactional
    public MissionDto update(UUID id, MissionRequest req) {
        Mission mission = missionRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Mission introuvable"));

        mission.setName(req.name());
        mission.setType(req.type());
        mission.setDate(req.date());
        mission.setStartTime(req.startTime());
        mission.setLocation(req.location());
        if (req.status() != null) mission.setStatus(req.status());

        return MissionDto.from(missionRepository.save(mission));
    }

    @Transactional
    public MissionDto addParticipant(UUID id, String email, Authentication auth) {
        Mission mission = missionRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Mission introuvable"));

        if (!isAdmin(auth) && !isVisible(mission, auth.getName())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Accès refusé");
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Aucun utilisateur avec cet email"));

        boolean alreadyIn = mission.getParticipants().stream().anyMatch(p -> p.getId().equals(user.getId()));
        boolean isCreator = mission.getCreator() != null && mission.getCreator().getId().equals(user.getId());
        if (!alreadyIn && !isCreator) {
            mission.getParticipants().add(user);
        }

        return MissionDto.from(missionRepository.save(mission));
    }

    @Transactional
    public MissionDto removeParticipant(UUID id, UUID userId, Authentication auth) {
        Mission mission = missionRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Mission introuvable"));

        if (!isAdmin(auth) && !isVisible(mission, auth.getName())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Accès refusé");
        }

        mission.getParticipants().removeIf(p -> p.getId().equals(userId));
        return MissionDto.from(missionRepository.save(mission));
    }

    @Transactional
    public void delete(UUID id) {
        Mission mission = missionRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Mission introuvable"));
        invCheckItemRepository.deleteAllByMissionId(id);  // immédiat — exécuté avant les deletes Hibernate buffferisés
        invCheckRepository.deleteAllByMissionId(id);
        missionRepository.delete(mission);
    }

    private boolean isAdmin(Authentication auth) {
        return auth.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(a -> a.equals("ROLE_ADMIN"));
    }

    private boolean isVisible(Mission mission, String email) {
        if (mission.getCreator() == null) return true;
        if (mission.getCreator().getEmail().equals(email)) return true;
        return mission.getParticipants().stream().anyMatch(p -> p.getEmail().equals(email));
    }
}
