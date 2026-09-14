package fr.vestalog.api.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.UUID;

@Entity
@Table(name = "inv_checks")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InvCheck {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "mission_id", nullable = false, unique = true)
    private Mission mission;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private InvCheckStatus status = InvCheckStatus.IN_PROGRESS;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "started_by", nullable = false)
    private User startedBy;

    @Column(nullable = false, updatable = false)
    private LocalDateTime startedAt;

    private LocalDateTime completedAt;

    @PrePersist
    void prePersist() {
        if (startedAt == null) startedAt = LocalDateTime.now(ZoneId.of("Europe/Paris"));
    }
}
