package fr.vestalog.api.repository;

import fr.vestalog.api.entity.InvCheckItem;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface InvCheckItemRepository extends JpaRepository<InvCheckItem, UUID> {

    @EntityGraph(attributePaths = {
            "sacItem", "sacItem.consumable",
            "sacItem.sac", "sacItem.sac.lot",
            "sacItem.pochette",
            "checkedBy"
    })
    List<InvCheckItem> findByInvCheckId(UUID invCheckId);

    @Modifying
    @Query("DELETE FROM InvCheckItem i WHERE i.invCheck.mission.id = :missionId")
    void deleteAllByMissionId(@Param("missionId") UUID missionId);
}
