package fr.vestalog.api.repository;

import fr.vestalog.api.entity.Sac;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface SacRepository extends JpaRepository<Sac, UUID> {}
