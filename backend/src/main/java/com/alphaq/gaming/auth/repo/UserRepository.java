package com.alphaq.gaming.auth.repo;

import com.alphaq.gaming.auth.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    Optional<User> findByMobile(String mobile);
    Optional<User> findByUsernameOrMobile(String username, String mobile);
    boolean existsByUsername(String username);
    boolean existsByMobile(String mobile);
    boolean existsByEmail(String email);
}
