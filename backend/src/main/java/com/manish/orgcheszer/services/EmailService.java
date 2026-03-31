package com.manish.orgcheszer.services;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    public void sendOtpEmail(String toEmail, String otp) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromEmail);
        message.setTo(toEmail);
        message.setSubject("Your OTP for Registration");
        message.setText(
                "Your OTP is: " + otp + "\n\nThis OTP for registering into orgcheszer is valid for 10 minutes.\n " +
                        "Thank you for using our service! \nDo not share it with anyone."
        );
        mailSender.send(message);
    }
}