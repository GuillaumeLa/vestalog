package fr.vestalog.api.repository;

import fr.vestalog.api.entity.Mission;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface MissionRepository extends JpaRepository<Mission, UUID> {

    @EntityGraph(attributePaths = {"creator", "participants"})
    @Query("SELECT m FROM Mission m ORDER BY m.createdAt DESC")
    List<Mission> findAllByOrderByCreatedAtDesc();

    @EntityGraph(attributePaths = {"creator", "participants"})
    @Query("""
            SELECT m FROM Mission m
            WHERE m.creator IS NULL OR m.creator.email = :email
               OR EXISTS (SELECT p FROM m.participants p WHERE p.email = :email)
            ORDER BY m.createdAt DESC
            """)
    List<Mission> findAllVisibleToUser(@Param("email") String email);

    @EntityGraph(attributePaths = {"creator", "participants"})
    @Query("SELECT m FROM Mission m WHERE m.id = :id")
    Optional<Mission> findByIdWithDetails(@Param("id") UUID id);

    @Query(value = """
            SELECT COALESCE(MAX(CAST(REPLACE(reference, '#M-', '') AS INTEGER)), 0)
            FROM missions
            WHERE reference ~ '^#M-[0-9]+$'
            """, nativeQuery = true)
    int findMaxSeq();
}
