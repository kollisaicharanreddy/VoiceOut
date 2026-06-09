package com.voiceout.service;

import com.voiceout.model.AdminUser;
import com.voiceout.repository.AdminUserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class SeedAdminUserService implements CommandLineRunner {

    private final AdminUserRepository adminUserRepository;
    private final PasswordEncoder passwordEncoder;
    private final String username;
    private final String password;

    public SeedAdminUserService(
            AdminUserRepository adminUserRepository,
            PasswordEncoder passwordEncoder,
            @Value("${voiceout.admin.username:admin}") String username,
            @Value("${voiceout.admin.password:admin123}") String password) {
        this.adminUserRepository = adminUserRepository;
        this.passwordEncoder = passwordEncoder;
        this.username = username;
        this.password = password;
    }

    @Override
    public void run(String... args) {
        AdminUser adminUser = adminUserRepository.findByUsername(username)
                .orElse(new AdminUser());
        adminUser.setUsername(username);
        adminUser.setPasswordHash(passwordEncoder.encode(password));
        adminUser.setRole("ROLE_ADMIN");
        adminUserRepository.save(adminUser);
    }
}