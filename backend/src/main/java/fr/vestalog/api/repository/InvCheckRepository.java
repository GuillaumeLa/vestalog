package fr.vestalog.api.repository;

import fr.vestalog.api.entity.InvCheck;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface InvCheckRepository extends JpaRepository<InvCheck, UUID> {

    // findFirst pour survivre aux éventuels doublons issus d'une race condition passée
    Optional<InvCheck> findFirstByMissionIdOrderByStartedAtAsc(UUID missionId);

    @EntityGraph(attributePaths = {"mission"})
    @Query("SELECT c FROM InvCheck c WHERE c.id = :id")
    Optional<InvCheck> findByIdWithMission(@Param("id") UUID id);

    @Modifying
    @Query("DELETE FROM InvCheck c WHERE c.mission.id = :missionId")
    void deleteAllByMissionId(@Param("missionId") UUID missionId);
}
