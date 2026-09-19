package com.alphaq.gaming.common.audit;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

/** Writes immutable audit entries for sensitive actions (master prompt §20). */
@Service
public class AuditService {

    private final AuditLogRepository repo;

    public AuditService(AuditLogRepository repo) { this.repo = repo; }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void record(String actor, String action, String entity, String detail) {
        repo.save(new AuditLog(actor, action, entity, detail));
    }
}
