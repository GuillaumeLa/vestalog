package fr.vestalog.api.controller;

import fr.vestalog.api.dto.lot.LotDetailDto;
import fr.vestalog.api.dto.lot.LotDto;
import fr.vestalog.api.dto.lot.LotRequest;
import fr.vestalog.api.service.LotService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/lots")
@RequiredArgsConstructor
public class LotController {

    private final LotService lotService;

    @GetMapping
    public ResponseEntity<List<LotDto>> getAll() {
        return ResponseEntity.ok(lotService.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<LotDetailDto> getDetail(@PathVariable UUID id) {
        return ResponseEntity.ok(lotService.getDetail(id));
    }

    @PostMapping
    public ResponseEntity<LotDto> create(@Valid @RequestBody LotRequest req) {
        return ResponseEntity.status(201).body(lotService.create(req));
    }

    @PutMapping("/{id}")
    public ResponseEntity<LotDto> update(@PathVariable UUID id, @Valid @RequestBody LotRequest req) {
        return ResponseEntity.ok(lotService.update(id, req));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        lotService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
