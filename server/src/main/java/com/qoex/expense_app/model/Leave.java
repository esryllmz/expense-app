package com.qoex.expense_app.model;

import com.qoex.expense_app.core.entity.BaseEntity;
import com.qoex.expense_app.core.enums.RequestStatus;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

import org.hibernate.annotations.Nationalized;

@Entity
@Table(name = "leaves")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Leave extends BaseEntity<Long> {

    @Nationalized
    @Column(nullable = false, length = 500)
    private String description;

    @Column(nullable = false)
    private LocalDate startDate;

    @Column(nullable = false)
    private LocalDate endDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RequestStatus status = RequestStatus.PENDING;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User employee;
}