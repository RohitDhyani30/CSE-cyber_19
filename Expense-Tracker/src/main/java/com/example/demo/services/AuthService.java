package com.example.demo.services;

import com.example.demo.dto.UserRequest;
import com.example.demo.dto.UserResponse;
import com.example.demo.entity.User;
import com.example.demo.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    private PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public String register(UserRequest userRequest){
        if(userRepository.findByEmail(userRequest.getEmail()).isPresent()){
            return "Email Already Exists";
        }
        User user = new User();
        user.setName(userRequest.getName());
        user.setEmail(userRequest.getEmail());
        user.setPassword(passwordEncoder.encode(userRequest.getPassword()));
        userRepository.save(user);
        user.setWalletBalance(java.math.BigDecimal.ZERO);
        return "User Created Successfully";
    }

    public UserResponse login(UserRequest userRequest){
        Optional<User> userOpt = userRepository.findByEmail(userRequest.getEmail());
        if(userOpt.isPresent()==false){
            throw new RuntimeException("User Not Found");
        }
        User user = userOpt.get();
        if(!passwordEncoder.matches(userRequest.getPassword(), user.getPassword())){
            throw new RuntimeException("Invalid Password");
        }
        return new UserResponse(user.getUserId(),user.getName(),user.getEmail() , user.getWalletBalance() ,user.getCreatedAt());
    }
}
