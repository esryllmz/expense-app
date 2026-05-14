package com.qoex.expense_app.model;

import com.qoex.expense_app.core.entity.BaseEntity;
import com.qoex.expense_app.core.enums.UserRole;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

import org.hibernate.annotations.Nationalized;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class User extends BaseEntity<Long> {

    @Nationalized
    @Column(nullable = false, length = 50)
    private String firstName;

    @Nationalized
    @Column(nullable = false, length = 50)
    private String lastName;

    @Column(nullable = false, unique = true, length = 150)
    private String email;

    @Column(nullable = false)
    private String password;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserRole role;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "manager_id")
    private User manager; // .NET: public virtual User Manager { get; set; }

    @OneToMany(mappedBy = "manager")
    private List<User> subordinates; // .NET: ICollection<User>

    @Column(name = "refresh_token")
    private String refreshToken;

    @Column(name = "refresh_token_expiration")
    private LocalDateTime refreshTokenExpiration;
}