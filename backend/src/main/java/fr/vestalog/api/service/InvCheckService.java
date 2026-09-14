package fr.vestalog.api.service;

import fr.vestalog.api.dto.invcheck.InvCheckDto;
import fr.vestalog.api.dto.invcheck.InvCheckDto.*;
import fr.vestalog.api.entity.*;
import fr.vestalog.api.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class InvCheckService {

    private final InvCheckRepository invCheckRepo;
    private final InvCheckItemRepository invCheckItemRepo;
    private final MissionRepository missionRepo;
    private final UserRepository userRepo;
    private final MissionTypeConfigRepository missionTypeConfigRepo;
    private final SacItemRepository sacItemRepo;

    // Self-injection via proxy so @Transactional on doCreate works when called from non-transactional createOrGet
    @Lazy
    @Autowired
    private InvCheckService self;

    // Non-transactional wrapper: catches unique constraint violation from concurrent calls
    public InvCheckDto createOrGet(UUID missionId, String userEmail) {
        try {
            return self.doCreate(missionId, userEmail);
        } catch (DataIntegrityViolationException e) {
            InvCheck existing = invCheckRepo.findFirstByMissionIdOrderByStartedAtAsc(missionId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Erreur inattendue"));
            return getState(existing.getId());
        }
    }

    @Transactional(readOnly = true)
    public Optional<InvCheckDto> getByMissionId(UUID missionId) {
        return invCheckRepo.findFirstByMissionIdOrderByStartedAtAsc(missionId)
                .map(c -> getState(c.getId()));
    }

    @Transactional
    public InvCheckDto doCreate(UUID missionId, String userEmail) {
        Optional<InvCheck> existing = invCheckRepo.findFirstByMissionIdOrderByStartedAtAsc(missionId);
        if (existing.isPresent()) {
            return getState(existing.get().getId());
        }

        Mission mission = missionRepo.findById(missionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Mission introuvable"));
        User startedBy = userRepo.findByEmail(userEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Utilisateur introuvable"));

        InvCheck check = InvCheck.builder()
                .mission(mission)
                .startedBy(startedBy)
                .build();
        invCheckRepo.saveAndFlush(check); // flush immédiatement pour déclencher la contrainte unique dans la transaction

        List<UUID> sacIds = missionTypeConfigRepo.findSacIdsByType(mission.getType());
        List<SacItem> sacItems = sacIds.isEmpty() ? List.of() : sacItemRepo.findBySacIdIn(sacIds);

        if (!sacItems.isEmpty()) {
            List<InvCheckItem> items = sacItems.stream()
                    .map(si -> InvCheckItem.builder()
                            .invCheck(check)
                            .sacItem(si)
                            .build())
                    .toList();
            invCheckItemRepo.saveAll(items);
        }

        return getState(check.getId());
    }

    @Transactional(readOnly = true)
    public InvCheckDto getState(UUID checkId) {
        InvCheck check = invCheckRepo.findByIdWithMission(checkId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Vérification introuvable"));

        List<InvCheckItem> checkItems = invCheckItemRepo.findByInvCheckId(checkId);

        return buildDto(check, checkItems);
    }

    @Transactional
    public InvCheckDto toggleItem(UUID checkId, UUID itemId, String userEmail) {
        InvCheckItem item = invCheckItemRepo.findById(itemId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Item introuvable"));

        if (!item.getInvCheck().getId().equals(checkId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Item n'appartient pas à cette vérification");
        }

        if (item.isChecked()) {
            item.setChecked(false);
            item.setCheckedBy(null);
            item.setCheckedAt(null);
        } else {
            User checker = userRepo.findByEmail(userEmail)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Utilisateur introuvable"));
            item.setChecked(true);
            item.setCheckedBy(checker);
            item.setCheckedAt(LocalDateTime.now(ZoneId.of("Europe/Paris")));
        }

        invCheckItemRepo.save(item);
        return getState(checkId);
    }

    @Transactional
    public InvCheckDto complete(UUID checkId) {
        InvCheck check = invCheckRepo.findById(checkId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Vérification introuvable"));

        if (check.getStatus() == InvCheckStatus.COMPLETED) {
            return getState(checkId);
        }

        check.setStatus(InvCheckStatus.COMPLETED);
        check.setCompletedAt(LocalDateTime.now(ZoneId.of("Europe/Paris")));
        invCheckRepo.save(check);
        return getState(checkId);
    }

    private InvCheckDto buildDto(InvCheck check, List<InvCheckItem> checkItems) {
        if (checkItems.isEmpty()) {
            return new InvCheckDto(
                    check.getId(),
                    check.getMission().getId(),
                    check.getMission().getName(),
                    check.getStatus(),
                    check.getStartedAt(),
                    check.getCompletedAt(),
                    0, 0,
                    List.of()
            );
        }

        // Group items by lotId → sacId
        Map<UUID, List<InvCheckItem>> byLotId = checkItems.stream()
                .collect(Collectors.groupingBy(i -> i.getSacItem().getSac().getLot().getId()));

        // Ordered lots from items (alphabetical)
        List<Lot> orderedLots = checkItems.stream()
                .map(i -> i.getSacItem().getSac().getLot())
                .collect(Collectors.toMap(Lot::getId, l -> l, (a, b) -> a, LinkedHashMap::new))
                .values().stream()
                .sorted(Comparator.comparing(Lot::getName))
                .toList();

        List<LotCheckDto> lotDtos = orderedLots.stream()
                .map(lot -> {
                    List<InvCheckItem> lotItems = byLotId.getOrDefault(lot.getId(), List.of());

                    Map<UUID, List<InvCheckItem>> bySacId = lotItems.stream()
                            .collect(Collectors.groupingBy(i -> i.getSacItem().getSac().getId()));

                    List<Sac> orderedSacs = lotItems.stream()
                            .map(i -> i.getSacItem().getSac())
                            .collect(Collectors.toMap(Sac::getId, s -> s, (a, b) -> a, LinkedHashMap::new))
                            .values().stream()
                            .sorted(Comparator.comparing(Sac::getLabel))
                            .toList();

                    List<SacCheckDto> sacDtos = orderedSacs.stream()
                            .map(sac -> buildSacDto(sac, bySacId.getOrDefault(sac.getId(), List.of())))
                            .toList();

                    int total = lotItems.size();
                    int checked = (int) lotItems.stream().filter(InvCheckItem::isChecked).count();

                    return new LotCheckDto(lot.getId(), lot.getName(), lot.getColor(), total, checked, sacDtos);
                })
                .toList();

        int total = checkItems.size();
        int checked = (int) checkItems.stream().filter(InvCheckItem::isChecked).count();

        return new InvCheckDto(
                check.getId(),
                check.getMission().getId(),
                check.getMission().getName(),
                check.getStatus(),
                check.getStartedAt(),
                check.getCompletedAt(),
                total, checked,
                lotDtos
        );
    }

    private SacCheckDto buildSacDto(Sac sac, List<InvCheckItem> items) {
        List<ItemCheckDto> directItems = items.stream()
                .filter(i -> i.getSacItem().getPochette() == null)
                .sorted(Comparator.comparing(i -> i.getSacItem().getConsumable().getName()))
                .map(this::toItemDto)
                .toList();

        Map<UUID, List<InvCheckItem>> byPochetteId = items.stream()
                .filter(i -> i.getSacItem().getPochette() != null)
                .collect(Collectors.groupingBy(i -> i.getSacItem().getPochette().getId()));

        List<PochetteCheckDto> pochetteDtos = items.stream()
                .filter(i -> i.getSacItem().getPochette() != null)
                .map(i -> i.getSacItem().getPochette())
                .collect(Collectors.toMap(Pochette::getId, p -> p, (a, b) -> a, LinkedHashMap::new))
                .values().stream()
                .sorted(Comparator.comparing(Pochette::getName))
                .map(pochette -> new PochetteCheckDto(
                        pochette.getId(),
                        pochette.getName(),
                        pochette.getEmoji(),
                        byPochetteId.getOrDefault(pochette.getId(), List.of()).stream()
                                .sorted(Comparator.comparing(i -> i.getSacItem().getConsumable().getName()))
                                .map(this::toItemDto)
                                .toList()
                ))
                .toList();

        return new SacCheckDto(sac.getId(), sac.getLabel(), sac.getColor(), directItems, pochetteDtos);
    }

    private ItemCheckDto toItemDto(InvCheckItem i) {
        Consumable c = i.getSacItem().getConsumable();
        return new ItemCheckDto(
                i.getId(),
                c.getName(),
                c.isHasExpiry(),
                c.isHasLotNumber(),
                i.getSacItem().getQuantity(),
                i.isChecked(),
                i.getCheckedBy() != null
                        ? i.getCheckedBy().getFirstName() + " " + i.getCheckedBy().getLastName()
                        : null,
                i.getCheckedAt()
        );
    }
}
