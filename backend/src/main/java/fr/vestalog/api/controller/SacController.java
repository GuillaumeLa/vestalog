package fr.vestalog.api.controller;

import fr.vestalog.api.dto.lot.ItemQuantityRequest;
import fr.vestalog.api.dto.lot.LotDetailDto;
import fr.vestalog.api.dto.lot.PochetteRequest;
import fr.vestalog.api.dto.lot.SacItemRequest;
import fr.vestalog.api.dto.lot.SacRequest;
import fr.vestalog.api.service.SacService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class SacController {

    private final SacService sacService;

    @PostMapping("/api/lots/{lotId}/sacs")
    public ResponseEntity<LotDetailDto.SacDetailDto> addSac(
            @PathVariable UUID lotId,
            @Valid @RequestBody SacRequest req) {
        return ResponseEntity.status(201).body(sacService.addSac(lotId, req));
    }

    @DeleteMapping("/api/sacs/{id}")
    public ResponseEntity<Void> deleteSac(@PathVariable UUID id) {
        sacService.deleteSac(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/api/sacs/{sacId}/pochettes")
    public ResponseEntity<LotDetailDto.PochetteDto> addPochette(
            @PathVariable UUID sacId,
            @Valid @RequestBody PochetteRequest req) {
        return ResponseEntity.status(201).body(sacService.addPochette(sacId, req));
    }

    @DeleteMapping("/api/pochettes/{id}")
    public ResponseEntity<Void> deletePochette(@PathVariable UUID id) {
        sacService.deletePochette(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/api/pochettes/{pochetteId}/items")
    public ResponseEntity<LotDetailDto.ItemDto> addItemToPochette(
            @PathVariable UUID pochetteId,
            @Valid @RequestBody SacItemRequest req) {
        return ResponseEntity.status(201).body(sacService.addItemToPochette(pochetteId, req));
    }

    @PostMapping("/api/sacs/{sacId}/items/direct")
    public ResponseEntity<LotDetailDto.ItemDto> addDirectItem(
            @PathVariable UUID sacId,
            @Valid @RequestBody SacItemRequest req) {
        return ResponseEntity.status(201).body(sacService.addDirectItem(sacId, req));
    }

    @DeleteMapping("/api/items/{id}")
    public ResponseEntity<Void> deleteItem(@PathVariable UUID id) {
        sacService.deleteItem(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/api/items/{id}")
    public ResponseEntity<LotDetailDto.ItemDto> updateItemQty(
            @PathVariable UUID id,
            @Valid @RequestBody ItemQuantityRequest req) {
        return ResponseEntity.ok(sacService.updateItemQty(id, req));
    }
}
