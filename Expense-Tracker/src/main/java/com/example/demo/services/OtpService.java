package com.example.demo.services;

import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class OtpService {
    private final Map<String, String> otpStorage = new HashMap<>();

    public String generateOtp(String email){
        String otp = String.format("%06d", new Random().nextInt(999999));
        otpStorage.put(email,otp);
        return otp;
    }

    public boolean verifyOtp(String email, String enteredOtp){
        String correctOtp = otpStorage.get(email);
        if(correctOtp != null &&  correctOtp.equals(enteredOtp)){
            return true;
        }
        return false;
    }
}
