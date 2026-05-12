package com.qoex.expense_app.model;

import com.qoex.expense_app.core.entity.BaseEntity;
import com.qoex.expense_app.core.enums.UserRole;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class User extends BaseEntity<Long> {

    private String firstName;
    private String lastName;

    @Column(unique = true)
    private String email;
    private String password;

    @Enumerated(EnumType.STRING)
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