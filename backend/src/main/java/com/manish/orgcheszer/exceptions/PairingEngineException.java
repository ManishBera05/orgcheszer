package com.manish.orgcheszer.exceptions;

public class PairingEngineException extends RuntimeException {
    public PairingEngineException(String message) {
        super(message);
    }

    public PairingEngineException(String message, Throwable cause) {
        super(message, cause);
    }
}