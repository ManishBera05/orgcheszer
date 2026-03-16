package com.manish.orgcheszer.enums;

public enum TicketStatus {
    VALID,       // registered, not yet checked in
    CHECKED_IN,  // physically present — ticket scanned on tournament day
    CANCELLED    // registration cancelled / refunded
}