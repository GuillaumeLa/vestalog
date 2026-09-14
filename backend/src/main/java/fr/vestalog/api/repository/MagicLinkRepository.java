package fr.vestalog.api.repository;

import fr.vestalog.api.entity.MagicLink;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

public interface MagicLinkRepository extends JpaRepository<MagicLink, UUID> {
    Optional<MagicLink> findByToken(String token);

    @Modifying
    @Transactional
    @Query("DELETE FROM MagicLink t WHERE t.expiresAt < :now OR t.used = true")
    void deleteExpiredAndUsed(@Param("now") LocalDateTime now);

    @Modifying
    @Transactional
    @Query("UPDATE MagicLink m SET m.used = true WHERE m.email = :email AND m.used = false")
    void invalidatePreviousLinks(@Param("email") String email);
}
