package com.manish.orgcheszer.services;

import com.manish.orgcheszer.dtos.StaffForTournamentResponse;
import com.manish.orgcheszer.dtos.StaffKeyResponse;
import com.manish.orgcheszer.dtos.TournamentResponse;
import com.manish.orgcheszer.entities.StaffKey;
import com.manish.orgcheszer.entities.Tournament;
import com.manish.orgcheszer.entities.TournamentStaff;
import com.manish.orgcheszer.entities.Users;
import com.manish.orgcheszer.enums.TournamentStatus;
import com.manish.orgcheszer.exceptions.ConflictException;
import com.manish.orgcheszer.exceptions.ResourceNotFoundException;
import com.manish.orgcheszer.exceptions.UnauthorizedActionException;
import com.manish.orgcheszer.repositories.PlayerTournamentStatsRepository;
import com.manish.orgcheszer.repositories.RegistrationRequestRepository;
import com.manish.orgcheszer.repositories.StaffKeyRepository;
import com.manish.orgcheszer.repositories.TournamentRepository;
import com.manish.orgcheszer.repositories.TournamentStaffRepository;
import com.manish.orgcheszer.repositories.UsersRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StaffKeyService {

    private final StaffKeyRepository staffKeyRepository;
    private final TournamentRepository tournamentRepository;
    private final TournamentStaffRepository tournamentStaffRepository;
    private final UsersRepository usersRepository;
    private final PlayerTournamentStatsRepository playerTournamentStatsRepository;
    private final RegistrationRequestRepository registrationRequestRepository;

    private Users getCurrentUser() {
        String email = SecurityContextHolder.getContext()
                .getAuthentication()
                .getName();
        return usersRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    // Generate N keys for a tournament (organizer only)
    public List<String> generateKeys(UUID tournamentId, int numberOfKeys) {
        Tournament tournament = tournamentRepository.findById(tournamentId)
                .orElseThrow(() -> new ResourceNotFoundException("Tournament not found"));

        Users currentUser = getCurrentUser();
        if (!tournament.getOrganizer().getId().equals(currentUser.getId())) {
            throw new UnauthorizedActionException("Only the organizer can generate staff keys");
        }

        if (tournament.getStatus() != TournamentStatus.UPCOMING &&
                tournament.getStatus() != TournamentStatus.ONGOING) {
            throw new ConflictException("Cannot generate keys for a cancelled or completed tournament");
        }

        if(staffKeyRepository.findByTournamentTournamentId(tournamentId).size() + numberOfKeys > 50){
            throw new ConflictException("Cannot create more than 50 staffs for a single tournament");
        }

        List<String> keys = new ArrayList<>();

        for (int i = 0; i < numberOfKeys; i++) {
            String keyValue = UUID.randomUUID().toString();

            StaffKey staffKey = new StaffKey();
            staffKey.setKeyValue(keyValue);
            staffKey.setTournament(tournament);
            staffKey.setUsed(false);
            staffKey.setCreatedAt(LocalDateTime.now());

            staffKeyRepository.save(staffKey);
            keys.add(keyValue);
        }

        return keys; // returned once to organizer, store them safely
    }

    // Redeem a key (staff member)
    public void redeemKey(String keyValue) {
        Users currentUser = getCurrentUser();

        StaffKey staffKey = staffKeyRepository.findByKeyValue(keyValue)
                .orElseThrow(() -> new RuntimeException("Invalid key"));

        if (staffKey.isUsed()) {
            throw new ConflictException("This key has already been used");
        }

        Tournament tournament = staffKey.getTournament();

        // Can't join as staff if already a player
        if (playerTournamentStatsRepository
                .existsByPlayerIdAndTournamentTournamentId(
                        currentUser.getId(),
                        tournament.getTournamentId()) ||
                registrationRequestRepository.
                        existsByPlayerIdAndTournamentTournamentId(
                                currentUser.getId(), tournament.getTournamentId())
            ) {
            throw new ConflictException("You are already registered or have a pending request as a player in this tournament");
        }

        // Can't join as staff if already a staff
        if (tournamentStaffRepository
                .existsByUserIdAndTournamentTournamentId(
                        currentUser.getId(),
                        tournament.getTournamentId())) {
            throw new ConflictException("You are already a staff member in this tournament");
        }

        // Can't join as staff if you are the organizer
        if (tournament.getOrganizer().getId().equals(currentUser.getId())) {
            throw new ConflictException("Organizer cannot be a staff member");
        }

        // Mark key as used
        staffKey.setUsed(true);
        staffKey.setUsedAt(LocalDateTime.now());
        staffKeyRepository.save(staffKey);

        // Create TournamentStaff entry
        TournamentStaff tournamentStaff = new TournamentStaff();
        tournamentStaff.setUser(currentUser);
        tournamentStaff.setTournament(tournament);
        tournamentStaff.setAssignedAt(LocalDateTime.now());
        tournamentStaff.setKeyUsed(keyValue);
        tournamentStaffRepository.save(tournamentStaff);
    }

    // View all keys for a tournament (organizer only)
    public List<StaffKeyResponse> getKeysForTournament(UUID tournamentId) {
        Tournament tournament = tournamentRepository.findById(tournamentId)
                .orElseThrow(() -> new ResourceNotFoundException("Tournament not found"));

        Users currentUser = getCurrentUser();
        if (!tournament.getOrganizer().getId().equals(currentUser.getId())) {
            throw new UnauthorizedActionException("Only the organizer can view staff keys");
        }

        return staffKeyRepository.findByTournamentTournamentId(tournamentId)
                .stream()
                .map(key -> new StaffKeyResponse(
                        key.getKeyValue(),
                        key.isUsed(),
                        key.getCreatedAt(),
                        key.getUsedAt()
                ))
                .collect(Collectors.toList());
    }

    // View all staffs for a tournament (organizer only)
    public List<StaffForTournamentResponse> getStaffsForTournament(UUID tournamentId) {
        Tournament tournament = tournamentRepository.findById(tournamentId)
                .orElseThrow(() -> new ResourceNotFoundException("Tournament not found"));

        Users currentUser = getCurrentUser();
        if (!tournament.getOrganizer().getId().equals(currentUser.getId())) {
            throw new UnauthorizedActionException("Only the organizer can view staff keys");
        }

//    private String keyUsed;
//    private String name;
//    private UUID userID;
        List<StaffForTournamentResponse> allStaffForTournamentResponse = new ArrayList<>();
//        int numberOfStaffs = tournamentStaffRepository.
        List<TournamentStaff> allTournamentStaffs =
                tournamentStaffRepository.findByTournamentTournamentId(tournamentId);


        for(TournamentStaff ts : allTournamentStaffs){
            StaffForTournamentResponse staffForTournamentResponse = StaffForTournamentResponse.builder()
                    .keyUsed(ts.getKeyUsed())
                    .userID(ts.getUser().getId())
                    .name(ts.getUser().getFirstName() + " "+ ts.getUser().getLastName())
                    .build();
            allStaffForTournamentResponse.add(staffForTournamentResponse);
        }


        return allStaffForTournamentResponse;
//        return staffKeyRepository.findByTournamentTournamentId(tournamentId)
//                .stream()
//                .map(key -> new StaffKeyResponse(
//                        key.getKeyValue(),
//                        key.isUsed(),
//                        key.getCreatedAt(),
//                        key.getUsedAt()
//                ))
//                .collect(Collectors.toList());

        // name, userid, keyused
    }
}