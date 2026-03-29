package com.manish.orgcheszer.exceptions;

// 404 Not found error
public class ResourceNotFoundException extends RuntimeException {
    public ResourceNotFoundException(String message) { super(message); }
}