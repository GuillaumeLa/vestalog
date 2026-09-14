package fr.vestalog.api.repository;

import fr.vestalog.api.entity.RefreshToken;
import fr.vestalog.api.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, UUID> {
    Optional<RefreshToken> findByToken(String token);

    // Atomic claim: marks token as revoked only if currently not revoked.
    // Returns 1 on success, 0 if already revoked or not found (concurrent rotation).
    @Modifying
    @Transactional
    @Query("UPDATE RefreshToken r SET r.revoked = true WHERE r.token = :token AND r.revoked = false")
    int atomicRevoke(@Param("token") String token);

    // Bulk JPQL delete — avoids the "load then delete" pattern that causes StaleStateException
    // under concurrent access.
    @Modifying
    @Transactional
    @Query("DELETE FROM RefreshToken r WHERE r.user = :user AND r.revoked = true")
    void deleteAllRevokedByUser(@Param("user") User user);

    @Modifying
    @Transactional
    @Query("DELETE FROM RefreshToken r WHERE r.expiresAt < :cutoff")
    void deleteAllExpiredBefore(@Param("cutoff") LocalDateTime cutoff);
}
