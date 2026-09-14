package fr.vestalog.api.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "inv_check_items",
    uniqueConstraints = @UniqueConstraint(columnNames = {"inv_check_id", "sac_item_id"}))
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InvCheckItem {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "inv_check_id", nullable = false)
    private InvCheck invCheck;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sac_item_id", nullable = false)
    private SacItem sacItem;

    @Column(nullable = false)
    @Builder.Default
    private boolean checked = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "checked_by")
    private User checkedBy;

    private LocalDateTime checkedAt;
}
