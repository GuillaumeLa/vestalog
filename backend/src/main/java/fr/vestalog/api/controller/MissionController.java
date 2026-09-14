package fr.vestalog.api.controller;

import fr.vestalog.api.dto.mission.MissionDto;
import fr.vestalog.api.dto.mission.MissionRequest;
import fr.vestalog.api.dto.mission.ParticipantRequest;
import fr.vestalog.api.service.MissionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/missions")
@RequiredArgsConstructor
public class MissionController {
    private final MissionService missionService;

    @GetMapping
    public ResponseEntity<List<MissionDto>> getAll(Authentication auth) {
        return ResponseEntity.ok(missionService.getAll(auth));
    }

    @GetMapping("/{id}")
    public ResponseEntity<MissionDto> getDetail(@PathVariable UUID id, Authentication auth) {
        return ResponseEntity.ok(missionService.getDetail(id, auth));
    }

    @PostMapping
    public ResponseEntity<MissionDto> create(@Valid @RequestBody MissionRequest req, Authentication auth) {
        return ResponseEntity.status(201).body(missionService.create(req, auth));
    }

    @PutMapping("/{id}")
    public ResponseEntity<MissionDto> update(@PathVariable UUID id, @Valid @RequestBody MissionRequest req) {
        return ResponseEntity.ok(missionService.update(id, req));
    }

    @PostMapping("/{id}/participants")
    public ResponseEntity<MissionDto> addParticipant(
            @PathVariable UUID id,
            @Valid @RequestBody ParticipantRequest req,
            Authentication auth) {
        return ResponseEntity.ok(missionService.addParticipant(id, req.email(), auth));
    }

    @DeleteMapping("/{id}/participants/{userId}")
    public ResponseEntity<MissionDto> removeParticipant(
            @PathVariable UUID id,
            @PathVariable UUID userId,
            Authentication auth) {
        return ResponseEntity.ok(missionService.removeParticipant(id, userId, auth));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        missionService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
