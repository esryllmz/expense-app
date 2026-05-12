package com.qoex.expense_app.core.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Getter
@Setter
@MappedSuperclass // Bu sınıfın alanları alt sınıfların tablolarına eklenir
@EntityListeners(AuditingEntityListener.class) // Tarihleri otomatik doldurur
public abstract class BaseEntity<TId> {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private TId id;

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdDate;

    @LastModifiedDate
    private LocalDateTime updatedDate;
}