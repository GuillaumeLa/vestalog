package fr.vestalog.api.repository;

import fr.vestalog.api.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByEmail(String email);

    @Modifying
    @Transactional
    @Query(value = """
            INSERT INTO users (id, email, first_name, last_name, role)
            VALUES (gen_random_uuid(), :email, :firstName, :lastName, 'MEMBER')
            ON CONFLICT (email) DO NOTHING
            """, nativeQuery = true)
    void insertIfNotExists(@Param("email") String email,
                           @Param("firstName") String firstName,
                           @Param("lastName") String lastName);
}