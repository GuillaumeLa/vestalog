package fr.vestalog.api.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "mission_type_configs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MissionTypeConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Enumerated(EnumType.STRING)
    @Column(unique = true, nullable = false)
    private MissionType type;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "mission_type_config_lots",
            joinColumns = @JoinColumn(name = "config_id"),
            inverseJoinColumns = @JoinColumn(name = "lot_id")
    )
    @OrderBy("name ASC")
    @Builder.Default
    private List<Lot> lots = new ArrayList<>();
}
