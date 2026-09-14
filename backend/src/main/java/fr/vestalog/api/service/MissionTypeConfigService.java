package fr.vestalog.api.service;

import fr.vestalog.api.dto.mission.MissionTypeConfigDto;
import fr.vestalog.api.dto.mission.MissionTypeConfigRequest;
import fr.vestalog.api.entity.Lot;
import fr.vestalog.api.entity.MissionType;
import fr.vestalog.api.entity.MissionTypeConfig;
import fr.vestalog.api.repository.LotRepository;
import fr.vestalog.api.repository.MissionTypeConfigRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MissionTypeConfigService {

    private final MissionTypeConfigRepository configRepository;
    private final LotRepository lotRepository;

    public List<MissionTypeConfigDto> getAll() {
        Map<MissionType, MissionTypeConfig> byType = configRepository.findAll().stream()
                .collect(Collectors.toMap(MissionTypeConfig::getType, c -> c));

        return Arrays.stream(MissionType.values())
                .map(type -> {
                    MissionTypeConfig config = byType.get(type);
                    List<Lot> lots = config != null ? config.getLots() : List.of();
                    return MissionTypeConfigDto.from(type, lots);
                })
                .toList();
    }

    @Transactional
    public MissionTypeConfigDto setLots(MissionType type, MissionTypeConfigRequest req) {
        MissionTypeConfig config = configRepository.findByType(type)
                .orElseGet(() -> MissionTypeConfig.builder().type(type).build());

        List<Lot> lots = (req.lotIds() == null || req.lotIds().isEmpty())
                ? List.of()
                : lotRepository.findAllById(req.lotIds());

        config.getLots().clear();
        config.getLots().addAll(lots);
        configRepository.save(config);

        return MissionTypeConfigDto.from(type, lots);
    }
}
