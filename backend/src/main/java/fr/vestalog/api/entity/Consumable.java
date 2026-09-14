package fr.vestalog.api.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.UUID;

@Entity
@Table(name = "consumables")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Consumable {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(unique = true, nullable = false)
    private String internalId;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    @Builder.Default
    private boolean hasExpiry = false;

    @Column(nullable = false)
    @Builder.Default
    private boolean hasLotNumber = false;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void prePersist() {
        if (createdAt == null) createdAt = LocalDateTime.now(ZoneId.of("Europe/Paris"));
    }
}
