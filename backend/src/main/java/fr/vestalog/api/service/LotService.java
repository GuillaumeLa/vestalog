package fr.vestalog.api.service;

import fr.vestalog.api.dto.lot.LotDetailDto;
import fr.vestalog.api.dto.lot.LotDto;
import fr.vestalog.api.dto.lot.LotRequest;
import fr.vestalog.api.entity.Lot;
import fr.vestalog.api.entity.Pochette;
import fr.vestalog.api.entity.Sac;
import fr.vestalog.api.entity.SacItem;
import fr.vestalog.api.repository.LotRepository;
import fr.vestalog.api.repository.PochetteRepository;
import fr.vestalog.api.repository.SacItemRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LotService {

    private final LotRepository lotRepository;
    private final PochetteRepository pochetteRepository;
    private final SacItemRepository sacItemRepository;
    private final JdbcTemplate jdbcTemplate;

    public List<LotDto> getAll() {
        return lotRepository.findAllByOrderByCreatedAtAsc().stream()
                .map(LotDto::from)
                .toList();
    }

    @Transactional
    public LotDetailDto getDetail(UUID id) {
        Lot lot = lotRepository.findWithSacsById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Lot introuvable"));

        List<UUID> sacIds = lot.getSacs().stream().map(Sac::getId).toList();

        Map<UUID, List<Pochette>> pochettesBySac = new HashMap<>();
        Map<UUID, List<SacItem>> itemsByPochette = new HashMap<>();
        Map<UUID, List<SacItem>> directItemsBySac = new HashMap<>();

        if (!sacIds.isEmpty()) {
            pochettesBySac = pochetteRepository.findBySacIdIn(sacIds).stream()
                    .collect(Collectors.groupingBy(p -> p.getSac().getId()));

            for (SacItem item : sacItemRepository.findBySacIdIn(sacIds)) {
                if (item.getPochette() == null) {
                    directItemsBySac.computeIfAbsent(item.getSac().getId(), k -> new ArrayList<>()).add(item);
                } else {
                    itemsByPochette.computeIfAbsent(item.getPochette().getId(), k -> new ArrayList<>()).add(item);
                }
            }
        }

        final Map<UUID, List<Pochette>> finalPochettes = pochettesBySac;
        final Map<UUID, List<SacItem>> finalPochetteItems = itemsByPochette;
        final Map<UUID, List<SacItem>> finalDirectItems = directItemsBySac;

        List<LotDetailDto.SacDetailDto> sacDtos = lot.getSacs().stream().map(sac -> {
            List<LotDetailDto.PochetteDto> pochetteDtos = finalPochettes.getOrDefault(sac.getId(), List.of())
                    .stream().map(p -> {
                        List<LotDetailDto.ItemDto> items = finalPochetteItems.getOrDefault(p.getId(), List.of())
                                .stream().map(LotService::toItemDto).toList();
                        return new LotDetailDto.PochetteDto(p.getId(), p.getName(), p.getEmoji(), items);
                    }).toList();
            List<LotDetailDto.ItemDto> directDtos = finalDirectItems.getOrDefault(sac.getId(), List.of())
                    .stream().map(LotService::toItemDto).toList();
            return new LotDetailDto.SacDetailDto(sac.getId(), sac.getLabel(), sac.getColor(), pochetteDtos, directDtos);
        }).toList();

        return new LotDetailDto(lot.getId(), lot.getInternalId(), lot.getName(), lot.getDescription(),
                lot.getColor(), lot.isActive(), sacDtos);
    }

    static LotDetailDto.ItemDto toItemDto(SacItem item) {
        var c = item.getConsumable();
        return new LotDetailDto.ItemDto(item.getId(),
                new LotDetailDto.ConsumableRef(c.getId(), c.getInternalId(), c.getName()),
                item.getQuantity());
    }

    @Transactional
    public LotDto create(LotRequest req) {
        jdbcTemplate.execute("SELECT pg_advisory_xact_lock(1003)");
        String internalId = req.internalId() != null && !req.internalId().isBlank()
                ? req.internalId()
                : "LOT-%03d".formatted(lotRepository.findMaxAutoSeq() + 1);

        if (req.internalId() != null && !req.internalId().isBlank() && lotRepository.existsByInternalId(req.internalId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Cet ID de lot existe déjà.");
        }

        Lot lot = Lot.builder()
                .internalId(internalId)
                .name(req.name())
                .description(req.description())
                .color(req.color() != null && !req.color().isBlank() ? req.color() : "#D9251D")
                .active(req.active())
                .build();

        return LotDto.from(lotRepository.save(lot));
    }

    @Transactional
    public LotDto update(UUID id, LotRequest req) {
        Lot lot = lotRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Lot introuvable"));

        lot.setName(req.name());
        lot.setDescription(req.description());
        if (req.color() != null && !req.color().isBlank()) lot.setColor(req.color());
        lot.setActive(req.active());
        if (req.internalId() != null && !req.internalId().isBlank()) lot.setInternalId(req.internalId());

        return LotDto.from(lotRepository.save(lot));
    }

    @Transactional
    public void delete(UUID id) {
        Lot lot = lotRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Lot introuvable"));
        lotRepository.delete(lot);
    }
}
