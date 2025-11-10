package com.example.demo.controller;

import com.example.demo.dto.UserRequest;
import com.example.demo.dto.UserResponse;
import com.example.demo.entity.User;
import com.example.demo.services.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors; // <-- ADD THIS IMPORT

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api/users")
public class userController {

    private final UserService userService;
    private PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public userController(UserService userService) {
        this.userService = userService;
    }

    // This endpoint is from your old code, but it's better to use the main PUT /{id}
    // We'll leave it for now, but it's redundant.
    @PutMapping("/{id}/wallet")
    public ResponseEntity<UserResponse> updateWalletBalance(
            @PathVariable Integer id,
            @RequestParam BigDecimal amount) {
        return ResponseEntity.ok(userService.updateWalletBalance(id, amount));
    }

    @PostMapping
    public ResponseEntity<UserResponse> createUser(@RequestBody UserRequest userRequest){
        User user = new User();
        user.setName(userRequest.getName());
        user.setEmail(userRequest.getEmail());
        user.setPassword(passwordEncoder.encode(userRequest.getPassword()));

        User createdUser = userService.CreateUser(user);

        // Return the safe DTO
        UserResponse response = new UserResponse(
                createdUser.getUserId(),
                createdUser.getName(),
                createdUser.getEmail(),
                createdUser.getWalletBalance(),
                createdUser.getCreatedAt()
        );
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<List<UserResponse>> getAllUsers(){
        return ResponseEntity.ok(userService.getAllUsers());
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserResponse> getUserById(@PathVariable Integer id){
        // Your UserService returns Optional<User>
        Optional<User> userOpt = userService.getUserById(id);

        if(userOpt.isPresent()) {
            User user = userOpt.get();
            // We convert it to the safe DTO here
            UserResponse response = new UserResponse(
                    user.getUserId(),
                    user.getName(),
                    user.getEmail(),
                    user.getWalletBalance(),
                    user.getCreatedAt()
            );
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<UserResponse> updateUser(
            @PathVariable Integer id,
            @RequestBody UserRequest userRequest){

        // 1. Pass the DTO to the smart updateUser method in your service
        User updatedUser = userService.updateUser(id, userRequest);

        // 2. Convert the updated User entity to a safe UserResponse
        UserResponse response = new UserResponse(
                updatedUser.getUserId(),
                updatedUser.getName(),
                updatedUser.getEmail(),
                updatedUser.getWalletBalance(),
                updatedUser.getCreatedAt()
        );
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Integer id) {
        userService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }
}

