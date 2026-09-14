package fr.vestalog.api.controller;

import fr.vestalog.api.dto.consumable.ConsumableDto;
import fr.vestalog.api.dto.consumable.ConsumableRequest;
import fr.vestalog.api.service.ConsumableService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/consumables")
@RequiredArgsConstructor
public class ConsumableController {
    private final ConsumableService consumableService;

    @GetMapping
    public ResponseEntity<List<ConsumableDto>> getAll(@RequestParam(required = false) String q) {
        return ResponseEntity.ok(consumableService.getAll(q));
    }

    @PostMapping
    public ResponseEntity<ConsumableDto> create(@Valid @RequestBody ConsumableRequest req) {
        return ResponseEntity.status(201).body(consumableService.create(req));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ConsumableDto> update(@PathVariable UUID id, @Valid @RequestBody ConsumableRequest req) {
        return ResponseEntity.ok(consumableService.update(id, req));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        consumableService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
