package fr.vestalog.api.repository;

import fr.vestalog.api.entity.MissionType;
import fr.vestalog.api.entity.MissionTypeConfig;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface MissionTypeConfigRepository extends JpaRepository<MissionTypeConfig, UUID> {

    @EntityGraph(attributePaths = {"lots"})
    @Override
    List<MissionTypeConfig> findAll();

    Optional<MissionTypeConfig> findByType(MissionType type);

    @org.springframework.data.jpa.repository.Query("SELECT s.id FROM MissionTypeConfig c JOIN c.lots l JOIN l.sacs s WHERE c.type = :type")
    java.util.List<UUID> findSacIdsByType(@org.springframework.data.repository.query.Param("type") MissionType type);
}
