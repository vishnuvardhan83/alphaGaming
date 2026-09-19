package com.alphaq.gaming.common.audit;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "audit_log")
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 80)
    private String actor;

    @Column(nullable = false, length = 80)
    private String action;

    @Column(length = 80)
    private String entity;

    @Column(length = 500)
    private String detail;

    @Column(name = "created_at", insertable = false, updatable = false)
    private Instant createdAt;

    protected AuditLog() { }

    public AuditLog(String actor, String action, String entity, String detail) {
        this.actor = actor;
        this.action = action;
        this.entity = entity;
        this.detail = detail;
    }

    public Long getId() { return id; }
    public String getActor() { return actor; }
    public String getAction() { return action; }
    public String getEntity() { return entity; }
    public String getDetail() { return detail; }
    public Instant getCreatedAt() { return createdAt; }
}
