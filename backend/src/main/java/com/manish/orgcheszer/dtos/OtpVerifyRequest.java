package com.manish.orgcheszer.dtos;

import lombok.Data;

@Data
public class OtpVerifyRequest {
    private String email;
    private String otp;
}