package fr.vestalog.api.repository;

import fr.vestalog.api.entity.SacItem;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SacItemRepository extends JpaRepository<SacItem, UUID> {

    @EntityGraph(attributePaths = {"consumable"})
    List<SacItem> findBySacIdIn(List<UUID> sacIds);

    @EntityGraph(attributePaths = {"consumable"})
    Optional<SacItem> findWithConsumableById(UUID id);

    void deleteByPochetteId(UUID pochetteId);

    boolean existsByConsumableId(UUID consumableId);

    boolean existsBySacIdAndConsumableIdAndPochetteIsNull(UUID sacId, UUID consumableId);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.transaction.annotation.Transactional
    @org.springframework.data.jpa.repository.Query("DELETE FROM SacItem s WHERE s.pochette.id = :pochetteId")
    void deleteByPochetteIdBulk(@org.springframework.data.repository.query.Param("pochetteId") UUID pochetteId);
}
