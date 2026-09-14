package fr.vestalog.api.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "pochettes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Pochette {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    @Builder.Default
    private String emoji = "📦";

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sac_id", nullable = false)
    private Sac sac;
}
