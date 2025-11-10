package com.example.demo.services;

import java.util.List;
import java.util.Optional;

import com.example.demo.entity.User;
import com.example.demo.repository.UserRepository;
import jakarta.persistence.criteria.CriteriaBuilder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import com.example.demo.dto.UserResponse;
import com.example.demo.dto.UserRequest;
import com.example.demo.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import java.math.BigDecimal;
import java.util.stream.Collectors;

@Service
public class UserService {
    @Autowired
    private UserRepository userRepository;
    @Autowired(required = false) // Use (required = false) if it's in a separate config, or just @Autowired if it's in the main class
    private PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public User CreateUser(User user){
        if(userRepository.findByEmail(user.getEmail()).isPresent()){
            throw new RuntimeException("Email already exists");
        }
        // Set default wallet balance
        user.setWalletBalance(BigDecimal.ZERO);
        return userRepository.save(user);
    }

    public List<UserResponse> getAllUsers(){
        //return userRepository.findAll();

        List<User> users = userRepository.findAll();
        // Convert to safe DTOs
        return users.stream()
                .map(user -> new UserResponse(
                        user.getUserId(),
                        user.getName(),
                        user.getEmail(),
                        user.getWalletBalance(),
                        user.getCreatedAt()
                ))
                .collect(Collectors.toList());
    }

    public Optional<User> getUserById(Integer id){
        return userRepository.findById(id);
    }

    public User updateUser(Integer id, UserRequest userRequest) {
        // 1. Find the user
        User user = userRepository.findById(id)
                .orElseThrow(()-> new RuntimeException("User Not Found with id " + id));

        // 2. Check each field from the DTO and update if it's not empty

        // Update Name
        if (userRequest.getName() != null && !userRequest.getName().isEmpty()) {
            user.setName(userRequest.getName());
        }

        // Update Email
        if (userRequest.getEmail() != null && !userRequest.getEmail().isEmpty()) {
            // Check if the new email already exists (for a *different* user)
            Optional<User> existingEmail = userRepository.findByEmail(userRequest.getEmail());
            if (existingEmail.isPresent() && !existingEmail.get().getUserId().equals(id)) {
                throw new RuntimeException("Email already in use by another account");
            }
            user.setEmail(userRequest.getEmail());
        }

        // Update Password
        if (userRequest.getPassword() != null && !userRequest.getPassword().isEmpty()) {
            if (passwordEncoder == null) {
                // This is a safety check in case the PasswordEncoder bean isn't found
                throw new RuntimeException("PasswordEncoder is not available to hash password");
            }
            user.setPassword(passwordEncoder.encode(userRequest.getPassword()));
        }

        // Update Wallet Balance
        if (userRequest.getWalletBalance() != null) {
            // This allows setting wallet to 0.00
            user.setWalletBalance(userRequest.getWalletBalance());
        }

        // 3. Save and return the updated user
        return userRepository.save(user);
    }

    public UserResponse updateWalletBalance(Integer userId, BigDecimal amount) {
        // Find the user
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));

        // Set the new balance
        user.setWalletBalance(amount);

        // Save and get the updated user
        User savedUser = userRepository.save(user);

        // Return the DTO
        return new UserResponse(savedUser.getUserId(), savedUser.getName(), savedUser.getEmail(), savedUser.getWalletBalance(),user.getCreatedAt());
    }

    public void deleteUser(Integer id) {
        userRepository.deleteById(id);
    }
}
