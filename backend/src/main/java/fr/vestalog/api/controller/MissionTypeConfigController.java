package fr.vestalog.api.controller;

import fr.vestalog.api.dto.mission.MissionTypeConfigDto;
import fr.vestalog.api.dto.mission.MissionTypeConfigRequest;
import fr.vestalog.api.entity.MissionType;
import fr.vestalog.api.service.MissionTypeConfigService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/mission-types")
@RequiredArgsConstructor
public class MissionTypeConfigController {

    private final MissionTypeConfigService service;

    @GetMapping
    public ResponseEntity<List<MissionTypeConfigDto>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    @PutMapping("/{type}")
    public ResponseEntity<MissionTypeConfigDto> setLots(
            @PathVariable MissionType type,
            @RequestBody MissionTypeConfigRequest req) {
        return ResponseEntity.ok(service.setLots(type, req));
    }
}
