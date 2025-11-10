package com.example.demo.controller;

import com.example.demo.dto.MailRequest;
import com.example.demo.repository.UserRepository;
import com.example.demo.services.EmailService;
import com.example.demo.services.OtpService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@CrossOrigin("*")
@RestController
@RequestMapping("/otp")
public class OtpController {
    @Autowired
    private EmailService emailService;

    @Autowired
    private OtpService otpService;

    @Autowired
    private UserRepository userRepository;

    @PostMapping("/send")
    public ResponseEntity<String> sendOtp(@RequestBody MailRequest mailRequest){
        if(userRepository.findByEmail(mailRequest.getTo()).isPresent()){
            return ResponseEntity.status(HttpStatus.CONFLICT).body("Email already exists");
        }
        String otp = otpService.generateOtp(mailRequest.getTo());
        String body = "Your Verification Code Is: "+otp+" Enter It To Login.";
        String subject = "Your Login Verification OTP";
        emailService.sendEmail(mailRequest.getTo(), subject, body);
        return ResponseEntity.ok("OTP sent to " + mailRequest.getTo());
    }

    @PostMapping("/verify")
    public String verifyOtp(@RequestParam String email, @RequestParam String otp){
        boolean isValid = otpService.verifyOtp(email, otp);
        if(isValid){
            return "OTP verified Successfully";
        }else{
            return "Invalid OTP";
        }
    }
}
