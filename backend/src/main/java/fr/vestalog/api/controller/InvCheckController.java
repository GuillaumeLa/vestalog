package fr.vestalog.api.controller;

import fr.vestalog.api.dto.invcheck.InvCheckDto;
import fr.vestalog.api.service.InvCheckService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/inv-checks")
@RequiredArgsConstructor
public class InvCheckController {

    private final InvCheckService invCheckService;

    @GetMapping("/mission/{missionId}")
    public ResponseEntity<InvCheckDto> getByMission(@PathVariable UUID missionId) {
        return invCheckService.getByMissionId(missionId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/mission/{missionId}")
    public ResponseEntity<InvCheckDto> createOrGet(
            @PathVariable UUID missionId,
            Authentication auth) {
        return ResponseEntity.ok(invCheckService.createOrGet(missionId, auth.getName()));
    }

    @GetMapping("/{checkId}")
    public ResponseEntity<InvCheckDto> getState(@PathVariable UUID checkId) {
        return ResponseEntity.ok(invCheckService.getState(checkId));
    }

    @PatchMapping("/{checkId}/items/{itemId}")
    public ResponseEntity<InvCheckDto> toggleItem(
            @PathVariable UUID checkId,
            @PathVariable UUID itemId,
            Authentication auth) {
        return ResponseEntity.ok(invCheckService.toggleItem(checkId, itemId, auth.getName()));
    }

    @PostMapping("/{checkId}/complete")
    public ResponseEntity<InvCheckDto> complete(@PathVariable UUID checkId) {
        return ResponseEntity.ok(invCheckService.complete(checkId));
    }
}
