package fr.vestalog.api.repository;

import fr.vestalog.api.entity.Pochette;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PochetteRepository extends JpaRepository<Pochette, UUID> {

    @EntityGraph(attributePaths = {"sac"})
    List<Pochette> findBySacIdIn(List<UUID> sacIds);

    @EntityGraph(attributePaths = {"sac"})
    Optional<Pochette> findWithSacById(UUID id);
}
