package fr.vestalog.api.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "sacs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Sac {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String label;

    @Column(nullable = false)
    @Builder.Default
    private String color = "#3B82F6";

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lot_id", nullable = false)
    private Lot lot;

    @OneToMany(mappedBy = "sac", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<Pochette> pochettes = new ArrayList<>();
}
