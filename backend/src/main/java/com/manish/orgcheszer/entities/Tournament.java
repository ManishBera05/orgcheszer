package com.manish.orgcheszer.entities;

import com.manish.orgcheszer.enums.TournamentFormat;
import com.manish.orgcheszer.enums.TournamentStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
public class Tournament {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID tournamentId;

    @Column(name = "tournament_name",nullable = false)
    private String tournamentName;

    @Column(name = "start_time", nullable = false)
    private LocalDateTime startDataTime;

    @Column(name = "total_rounds", nullable = false)
    private int numberOfRounds;

    @Column(name = "max_participants_allowed", nullable = false)
    private int maxParticipants;

    @Column(name = "entry_fee", nullable = false)
    private int entryFee;

    @Column(name = "description")
    private String description;

    @Column(name = "location", nullable = false)
    private String location;

    @Column(name = "time_control", nullable = false)
    private String timeControl;

    @Enumerated(EnumType.STRING)
    @Column(name = "format", nullable = false)
    private TournamentFormat format;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private TournamentStatus status;

    @OneToMany(mappedBy = "tournament")
    private List<PlayerTournamentStats> playerTournamentStatsList;

    @OneToMany(mappedBy = "tournament")
    private List<Rounds> roundsPlayed;

    @ManyToMany
    @JoinTable(
            name = "tournament_players", // Name of the join table
            joinColumns = {
                    @JoinColumn(name = "tournament_id") // FK for Tournament
            },
            inverseJoinColumns = {
                    @JoinColumn(name = "player_id") // FK for Users
            }
    )
    private List<Users> players;

    @OneToMany(mappedBy = "tournament")
    private List<TournamentStaff> staffs;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tournament_organizer", nullable = false)
    private Users organizer;

    @OneToMany(mappedBy = "tournament")
    private List<TournamentTicket> tickets;
}
