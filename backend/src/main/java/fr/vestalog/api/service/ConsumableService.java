package fr.vestalog.api.service;

import fr.vestalog.api.dto.consumable.ConsumableDto;
import fr.vestalog.api.dto.consumable.ConsumableRequest;
import fr.vestalog.api.entity.Consumable;
import fr.vestalog.api.repository.ConsumableRepository;
import fr.vestalog.api.repository.SacItemRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ConsumableService {
    private final ConsumableRepository consumableRepository;
    private final SacItemRepository sacItemRepository;
    private final JdbcTemplate jdbcTemplate;

    public List<ConsumableDto> getAll(String q) {
        List<Consumable> results = (q != null && !q.isBlank())
                ? consumableRepository.search(q.trim())
                : consumableRepository.findAllByOrderByCreatedAtAsc();
        return results.stream().map(ConsumableDto::from).toList();
    }

    @Transactional
    public ConsumableDto create(ConsumableRequest req) {
        if (req.internalId() != null && !req.internalId().isBlank() && consumableRepository.existsByInternalId(req.internalId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Cet ID de consommable existe déjà.");
        }

        String internalId = req.internalId() != null && !req.internalId().isBlank()
                ? req.internalId()
                : generateInternalId();

        Consumable consumable = Consumable.builder()
                .internalId(internalId)
                .name(req.name())
                .hasExpiry(req.hasExpiry())
                .hasLotNumber(req.hasLotNumber())
                .build();

        return ConsumableDto.from(consumableRepository.save(consumable));
    }

    private String generateInternalId() {
        // Advisory lock — prevents concurrent duplicate ID generation
        jdbcTemplate.execute("SELECT pg_advisory_xact_lock(1002)");
        int seq = consumableRepository.findMaxAutoSeq() + 1;
        return "CONS-%03d".formatted(seq);
    }

    @Transactional
    public ConsumableDto update(UUID id, ConsumableRequest req) {
        Consumable consumable = consumableRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Consommable introuvable"));

        consumable.setName(req.name());
        if (req.internalId() != null && !req.internalId().isBlank()) {
            consumable.setInternalId(req.internalId());
        }
        consumable.setHasExpiry(req.hasExpiry());
        consumable.setHasLotNumber(req.hasLotNumber());

        return ConsumableDto.from(consumableRepository.save(consumable));
    }

    @Transactional
    public void delete(UUID id) {
        Consumable consumable = consumableRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Consommable introuvable"));
        if (sacItemRepository.existsByConsumableId(id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Ce consommable est utilisé dans des sacs, retirez-le d'abord.");
        }
        consumableRepository.delete(consumable);
    }
}
