package fr.vestalog.api.repository;

import fr.vestalog.api.entity.Lot;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface LotRepository extends JpaRepository<Lot, UUID> {

    @EntityGraph(attributePaths = {"sacs"})
    List<Lot> findAllByOrderByCreatedAtAsc();

    @EntityGraph(attributePaths = {"sacs"})
    Optional<Lot> findWithSacsById(UUID id);

    @Query(value = """
            SELECT COALESCE(MAX(CAST(REPLACE(internal_id, 'LOT-', '') AS INTEGER)), 0)
            FROM lots
            WHERE internal_id ~ '^LOT-[0-9]+$'
            """, nativeQuery = true)
    int findMaxAutoSeq();

    boolean existsByInternalId(String internalId);
}
