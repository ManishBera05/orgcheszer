package com.manish.orgcheszer.exceptions;

// 409 Conflict error
public class ConflictException extends RuntimeException {
    public ConflictException(String message) { super(message); }
}