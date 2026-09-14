package fr.vestalog.api.repository;

import fr.vestalog.api.entity.Consumable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.UUID;

public interface ConsumableRepository extends JpaRepository<Consumable, UUID> {
    List<Consumable> findAllByOrderByCreatedAtAsc();

    @Query(value = """
            SELECT COALESCE(MAX(CAST(REPLACE(internal_id, 'CONS-', '') AS INTEGER)), 0)
            FROM consumables
            WHERE internal_id ~ '^CONS-[0-9]+$'
            """, nativeQuery = true)
    int findMaxAutoSeq();

    boolean existsByInternalId(String internalId);

    @Query("SELECT c FROM Consumable c WHERE LOWER(c.name) LIKE LOWER(CONCAT('%', :q, '%')) OR LOWER(c.internalId) LIKE LOWER(CONCAT('%', :q, '%')) ORDER BY c.createdAt ASC")
    List<Consumable> search(String q);
}
