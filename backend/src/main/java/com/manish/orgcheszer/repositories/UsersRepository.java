package com.manish.orgcheszer.repositories;

import com.manish.orgcheszer.entities.Users;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UsersRepository extends JpaRepository<Users, UUID> {
    Optional<Users> findByEmail(String email);         // for login
    boolean existsByEmail(String email);               // for registration duplicate check
}
