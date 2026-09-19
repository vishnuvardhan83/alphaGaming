package com.alphaq.gaming.admin;

import com.alphaq.gaming.auth.entity.Role;
import com.alphaq.gaming.auth.entity.User;
import com.alphaq.gaming.auth.repo.RoleRepository;
import com.alphaq.gaming.auth.repo.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Ensures an OWNER account exists on startup (idempotent). Dev defaults can be
 * overridden by env vars; change the password in any shared environment.
 */
@Component
public class AdminSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(AdminSeeder.class);

    private final UserRepository users;
    private final RoleRepository roles;
    private final PasswordEncoder encoder;

    @Value("${ADMIN_USERNAME:owner}") private String adminUsername;
    @Value("${ADMIN_MOBILE:9000000000}") private String adminMobile;
    @Value("${ADMIN_PASSWORD:Owner@12345}") private String adminPassword;

    public AdminSeeder(UserRepository users, RoleRepository roles, PasswordEncoder encoder) {
        this.users = users;
        this.roles = roles;
        this.encoder = encoder;
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (users.existsByUsername(adminUsername) || users.existsByMobile(adminMobile)) return;

        Role owner = roles.findByName("OWNER").orElseThrow();
        User u = new User();
        u.setUsername(adminUsername);
        u.setMobile(adminMobile);
        u.setPasswordHash(encoder.encode(adminPassword));
        u.setMobileVerified(true);
        u.addRole(owner);
        users.save(u);
        log.info("Seeded OWNER account '{}' (mobile {}). Change the password outside dev.", adminUsername, adminMobile);
    }
}
