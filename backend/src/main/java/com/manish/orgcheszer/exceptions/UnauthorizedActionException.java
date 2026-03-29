package com.manish.orgcheszer.exceptions;

// 403 Forbidden error
public class UnauthorizedActionException extends RuntimeException {
    public UnauthorizedActionException(String message) { super(message); }
}