package fr.vestalog.api.service;

import fr.vestalog.api.dto.lot.ItemQuantityRequest;
import fr.vestalog.api.dto.lot.LotDetailDto;
import fr.vestalog.api.dto.lot.PochetteRequest;
import fr.vestalog.api.dto.lot.SacItemRequest;
import fr.vestalog.api.dto.lot.SacRequest;
import fr.vestalog.api.entity.Pochette;
import fr.vestalog.api.entity.Sac;
import fr.vestalog.api.entity.SacItem;
import fr.vestalog.api.repository.ConsumableRepository;
import fr.vestalog.api.repository.LotRepository;
import fr.vestalog.api.repository.PochetteRepository;
import fr.vestalog.api.repository.SacItemRepository;
import fr.vestalog.api.repository.SacRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SacService {

    private final LotRepository lotRepository;
    private final SacRepository sacRepository;
    private final PochetteRepository pochetteRepository;
    private final SacItemRepository sacItemRepository;
    private final ConsumableRepository consumableRepository;

    @Transactional
    public LotDetailDto.SacDetailDto addSac(UUID lotId, SacRequest req) {
        var lot = lotRepository.findById(lotId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Lot introuvable"));
        var sac = Sac.builder()
                .label(req.label())
                .color(req.color() != null && !req.color().isBlank() ? req.color() : "#3B82F6")
                .lot(lot)
                .build();
        sac = sacRepository.save(sac);
        return new LotDetailDto.SacDetailDto(sac.getId(), sac.getLabel(), sac.getColor(), List.of(), List.of());
    }

    @Transactional
    public void deleteSac(UUID sacId) {
        var sac = sacRepository.findById(sacId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Sac introuvable"));
        sacRepository.delete(sac);
    }

    @Transactional
    public LotDetailDto.PochetteDto addPochette(UUID sacId, PochetteRequest req) {
        var sac = sacRepository.findById(sacId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Sac introuvable"));
        var pochette = Pochette.builder()
                .name(req.name())
                .emoji(req.emoji() != null && !req.emoji().isBlank() ? req.emoji() : "📦")
                .sac(sac)
                .build();
        pochette = pochetteRepository.save(pochette);
        return new LotDetailDto.PochetteDto(pochette.getId(), pochette.getName(), pochette.getEmoji(), List.of());
    }

    @Transactional
    public void deletePochette(UUID pochetteId) {
        var pochette = pochetteRepository.findById(pochetteId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Pochette introuvable"));
        sacItemRepository.deleteByPochetteIdBulk(pochetteId);
        pochetteRepository.delete(pochette);
    }

    @Transactional
    public LotDetailDto.ItemDto addItemToPochette(UUID pochetteId, SacItemRequest req) {
        var pochette = pochetteRepository.findWithSacById(pochetteId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Pochette introuvable"));
        var consumable = consumableRepository.findById(req.consumableId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Consommable introuvable"));
        var item = SacItem.builder()
                .sac(pochette.getSac())
                .pochette(pochette)
                .consumable(consumable)
                .quantity(req.quantity() > 0 ? req.quantity() : 1)
                .build();
        try {
            item = sacItemRepository.save(item);
        } catch (DataIntegrityViolationException e) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Ce consommable est déjà présent dans cette pochette.");
        }
        return LotService.toItemDto(item);
    }

    @Transactional
    public LotDetailDto.ItemDto addDirectItem(UUID sacId, SacItemRequest req) {
        var sac = sacRepository.findById(sacId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Sac introuvable"));
        var consumable = consumableRepository.findById(req.consumableId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Consommable introuvable"));
        if (sacItemRepository.existsBySacIdAndConsumableIdAndPochetteIsNull(sac.getId(), consumable.getId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Ce consommable est déjà présent en direct dans ce sac.");
        }
        var item = SacItem.builder()
                .sac(sac)
                .consumable(consumable)
                .quantity(req.quantity() > 0 ? req.quantity() : 1)
                .build();
        item = sacItemRepository.save(item);
        return LotService.toItemDto(item);
    }

    @Transactional
    public void deleteItem(UUID itemId) {
        var item = sacItemRepository.findById(itemId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Article introuvable"));
        sacItemRepository.delete(item);
    }

    @Transactional
    public LotDetailDto.ItemDto updateItemQty(UUID itemId, ItemQuantityRequest req) {
        var item = sacItemRepository.findWithConsumableById(itemId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Article introuvable"));
        if (req.quantity() > 0) item.setQuantity(req.quantity());
        sacItemRepository.save(item);
        return LotService.toItemDto(item);
    }
}
