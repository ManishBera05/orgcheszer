package com.manish.orgcheszer.entities;


import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.OneToMany;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
public class Users {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "first_name", nullable = false)
    private String firstName;

    @Column(name = "last_name", nullable = false)
    private String lastName;

    @Column(name = "dob" , nullable = false)
    private LocalDate dob;

    @Column(name = "email", nullable = false, unique = true)
    private String email;

    @Column(name = "password", nullable = false)
    private String password;

    @Column(name = "mobie_no", nullable = false)
    private String mobileNo;

    @Column(name = "fide_id")
    private String fideId;

    @Column(name = "elo_rating")
    private int eloRating;

    @OneToMany(mappedBy = "whitePlayer")
    private List<Game> gamesAsWhite;

    @OneToMany(mappedBy = "blackPlayer")
    private List<Game> gamesAsBlack;

    @OneToMany(mappedBy = "player")
    private List<PlayerTournamentStats> playerTournamentStats;

    @OneToMany(mappedBy = "organizer")
    private List<Tournament> organizedTournaments;

    @ManyToMany(mappedBy = "players")
    private List<Tournament> tournaments;

    @OneToMany(mappedBy = "user")
    private List<TournamentStaff> staffedTournaments;

    @OneToMany(mappedBy = "player")
    private List<TournamentTicket> tournamentTickets;
}
