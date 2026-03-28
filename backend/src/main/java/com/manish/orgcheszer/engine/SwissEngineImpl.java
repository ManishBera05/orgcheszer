package com.manish.orgcheszer.engine;

import com.manish.orgcheszer.engine.models.PastMatch;
import com.manish.orgcheszer.engine.models.Pairing;
import com.manish.orgcheszer.engine.models.PlayerStanding;
import javafo.api.JaVaFoApi;
import org.springframework.stereotype.Component;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.*;

@Component("SWISS")
public class SwissEngineImpl implements PairingEngine {

    @Override
    public List<Pairing> generatePairings(List<PlayerStanding> players,
                                          int currentRound,
                                          int totalRounds) {

        // Sort by rating DESC, assign 1-based pairing IDs
        players.sort(Comparator.comparingInt(PlayerStanding::getRating).reversed()
                .thenComparingInt(PlayerStanding::getPairingId)); // ← guarantees consistent order

        Map<Integer, UUID> idToUuidMap = new HashMap<>();
        for (int i = 0; i < players.size(); i++) {
            int pairingId = i + 1;
            players.get(i).setPairingId(pairingId);
            idToUuidMap.put(pairingId, players.get(i).getPlayerId());
        }

        // Generate TRF string
        String trfContent = generateTrfString(players, totalRounds);

        // Save to temp file for debugging
        saveTrfToFile(trfContent, "tournament_round_" + currentRound);

        // Call JaVaFo and parse output
        try {
            return callJavafoAndParse(trfContent, idToUuidMap);
        } catch (Exception e) {
            throw new RuntimeException("JaVaFo pairing failed: " + e.getMessage(), e);
        }
    }

     /**Calls JaVaFo API, captures output stream, parses pairings

     Sample JaVaFo output:
       5          ← round number (first line, we skip it)
       1 6        ← white=1, black=6
       7 2        ← white=7, black=2
       3 8        ← white=3, black=8
       9 4        ← white=9, black=4
       5 10       ← white=5, black=10=*/
    private List<Pairing> callJavafoAndParse(String trfContent,
                                             Map<Integer, UUID> idToUuidMap) throws Exception {

        // Convert TRF string → InputStream for JaVaFo
        InputStream inputStream = new ByteArrayInputStream(
                trfContent.getBytes(StandardCharsets.UTF_8));

        // Capture JaVaFo output
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();

        // Check the correctness of the tournamnet before generating the output
//        String checkerOutput = JaVaFoApi.exec(1200,inputStream);
//        System.out.println(checkerOutput);

        // Call JaVaFo — second arg is ignored per the API docs
        JaVaFoApi.exec(1000, "OrgCheszer", inputStream, outputStream);

        // Parse output
        String output = outputStream.toString(StandardCharsets.UTF_8);
        return parseJavafoOutput(output, idToUuidMap);
    }

     /**Parses JaVaFo output into List<Pairing>

     Output format:
       Line 1    → round number  (skip)
       Line 2+   → "whiteId blackId"

     Bye format: "X 0" where X = bye player's pairing ID, 0 = no opponent
       e.g. "5 0" means player 5 has a bye*/
    private List<Pairing> parseJavafoOutput(String output,
                                            Map<Integer, UUID> idToUuidMap) {
        List<Pairing> pairings = new ArrayList<>();

        if (output == null || output.isBlank()) {
            throw new RuntimeException("JaVaFo returned empty output — check TRF file format");
        }

        String[] lines = output.trim().split("\n");

        // Line 0 = round number, skip it
        for (int i = 1; i < lines.length; i++) {
            String line = lines[i].trim();
            if (line.isEmpty()) continue;

            String[] parts = line.split("\\s+");

            if (parts.length != 2) {
                throw new RuntimeException(
                        "Unexpected JaVaFo output line format: '" + line + "'" +
                                " — expected 'whiteId blackId'");
            }

            int whiteId = Integer.parseInt(parts[0]);
            int blackId = Integer.parseInt(parts[1]);

            UUID whiteUuid = idToUuidMap.get(whiteId);
            if (whiteUuid == null) {
                throw new RuntimeException(
                        "Unknown pairing ID in JaVaFo output: " + whiteId);
            }

            // Bye: blackId == 0 means no opponent
            if (blackId == 0) {
                pairings.add(Pairing.builder()
                        .whitePlayerId(whiteUuid)
                        .blackPlayerId(null)
                        .isBye(true)
                        .build());
            } else {
                // Normal pairing
                UUID blackUuid = idToUuidMap.get(blackId);
                if (blackUuid == null) {
                    throw new RuntimeException(
                            "Unknown pairing ID in JaVaFo output: " + blackId);
                }
                pairings.add(Pairing.builder()
                        .whitePlayerId(whiteUuid)
                        .blackPlayerId(blackUuid)
                        .isBye(false)
                        .build());
            }
        }

        return pairings;
    }

    // TRF String Builder
    private String generateTrfString(List<PlayerStanding> players, int totalRounds) {
        StringBuilder trf = new StringBuilder();

        // Header
        trf.append("012 Tournament Generated by OrgCheszer\n");
        trf.append("062 ").append(players.size()).append("\n");
        trf.append("072 ").append(players.size()).append("\n");
        trf.append("082 0\n");
        trf.append("092 Individual: Swiss-System\n");
        trf.append("102 Chief Arbiter\n");
        trf.append("112 \n");
        trf.append("122 90m + 30s\n");
        trf.append("132 \n");

        // JaVaFo extensions
        trf.append("XXR ").append(totalRounds).append("\n");
        trf.append("XXC white1\n");

        // Player lines
        for (PlayerStanding p : players) {
            trf.append(buildPlayerLine(p)).append("\n");
        }

        return trf.toString();
    }

    // Builds one 001 player line with exact column positions
    private String buildPlayerLine(PlayerStanding p) {
        StringBuilder line = new StringBuilder();

        line.append("001");                                                    // [1-3]
        line.append(" ");                                                      // [4]
        line.append(padLeft(String.valueOf(p.getPairingId()), 4));             // [5-8]
        line.append(" ");                                                      // [9]
        line.append(" ");                                                      // [10] gender
        line.append(padLeft(p.getTitle() != null ? p.getTitle() : "", 3));    // [11-13]
        line.append(" ");                                                      // [14]
        line.append(padRight(p.getName() != null ? p.getName() : "Unknown", 33)); // [15-47]
        line.append(" ");                                                      // [48]
        line.append(padLeft(p.getRating() > 0
                ? String.valueOf(p.getRating()) : "0", 4));                   // [49-52]
        line.append(" ");                                                      // [53]
        line.append(padRight(p.getFederation() != null
                ? p.getFederation() : "", 3));                                 // [54-56]
        line.append(" ");                                                      // [57]
        line.append(padLeft("", 11));                                          // [58-68] FIDE ID
        line.append(" ");                                                      // [69]
        line.append("    ");                                                   // [70-73] birth year
        line.append("       ");                                                // [74-80] ignored
        // [81-84] String.format already produces exactly 4 chars — no padLeft wrapper
        line.append(String.format(Locale.US, "%4.1f", p.getCurrentScore()));
        line.append(" ");                                                      // [85]
        line.append(padLeft(String.valueOf(p.getPairingId()), 4));             // [86-89]
        line.append("  ");                                                     // [90-91]

        // [92+] Round history blocks — 10 chars each
        for (PastMatch match : p.getMatchHistory()) {
            line.append(buildRoundBlock(match));
        }

        return line.toString();
    }

    // Builds one 10-character round block
    private String buildRoundBlock(PastMatch match) {
        String oppId = match.opponentPairingId() == 0
                ? "0000"
                : padLeft(String.valueOf(match.opponentPairingId()), 4);

        return oppId
                + " "
                + match.color()    // char: 'w', 'b', '-'
                + " "
                + match.result()   // char: '1', '=', '0', 'H', 'Z', 'U'
                + "  ";            // 2 trailing spaces → total 10 chars
    }

    // Saves TRF to temp directory for debugging
    private void saveTrfToFile(String content, String filenamePrefix) {
        try {
            Path tempFile = Files.createTempFile(filenamePrefix + "_", ".trf");
            Files.writeString(tempFile, content);
            System.out.println("TRF saved: " + tempFile.toAbsolutePath());
        } catch (IOException e) {
            System.err.println("Failed to write TRF file: " + e.getMessage());
        }
    }

    // Padding helpers=
    private String padLeft(String text, int width) {
        if (text == null) text = "";
        if (text.length() >= width) return text.substring(0, width);
        return String.format("%" + width + "s", text);
    }

    private String padRight(String text, int width) {
        if (text == null) text = "";
        if (text.length() >= width) return text.substring(0, width);
        return String.format("%-" + width + "s", text);
    }
}