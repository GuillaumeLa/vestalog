package fr.vestalog.api.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import java.util.UUID;

@Entity
@Table(name = "sac_items", uniqueConstraints = @UniqueConstraint(columnNames = {"pochette_id", "consumable_id"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SacItem {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sac_id", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private Sac sac;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pochette_id")
    @OnDelete(action = OnDeleteAction.CASCADE)
    private Pochette pochette;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "consumable_id", nullable = false)
    private Consumable consumable;

    @Column(nullable = false)
    @Builder.Default
    private int quantity = 1;
}
