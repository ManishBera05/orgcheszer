package com.manish.orgcheszer.exceptions;

// 400 Bad Request error
public class BadRequestException extends RuntimeException {
    public BadRequestException(String message) { super(message); }
}
