<div align="center">
  
  <!--[IMAGE PLACEHOLDER: Replace with your OrgCheszer Logo or a clean King Chess Piece Graphic, e.g., <img src="./public/logo.png" width="100" />] -->
  <h1>♟️ OrgCheszer</h1>
  
  <p><strong>A Production-Grade, FIDE-Compliant Chess Tournament SaaS Platform</strong></p>

  <p>
    <a href="https://orgcheszer.netlify.app" target="_blank">View Live Demo</a>
    ·
    <a href="#-features">Features</a>
    ·
    <a href="#-system-architecture--engineering">Architecture</a>
    ·
    <a href="#-getting-started">Local Setup</a>
  </p>

  <p>
    <img src="https://img.shields.io/badge/Spring_Boot-3.x-6DB33F?style=flat-square&logo=spring&logoColor=white" alt="Spring Boot" />
    <img src="https://img.shields.io/badge/Java-21-007396?style=flat-square&logo=java&logoColor=white" alt="Java" />
    <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React" />
    <img src="https://img.shields.io/badge/TypeScript-007ACC?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
    <img src="https://img.shields.io/badge/PostgreSQL-336791?style=flat-square&logo=postgresql&logoColor=white" alt="PostgreSQL" />
    <img src="https://img.shields.io/badge/Redis-DC382D?style=flat-square&logo=redis&logoColor=white" alt="Redis" />
  </p>
</div>

---

## 📖 Overview

**OrgCheszer** is a comprehensive, full-stack tournament management platform built for serious chess organizers, arbiters, and competitive players. 

Handling complex mathematical matchmaking rules is notoriously difficult. OrgCheszer solves this by integrating official FIDE-endorsed pairing engines, calculating advanced tiebreakers in real-time, and streamlining on-site physical tournament logistics through QR-code scanning and delegated staff access. 

<!--[IMAGE PLACEHOLDER: Insert a beautiful screenshot of your Home Page Hero section here] -->
*(Screenshot of the OrgCheszer Home Page)*

---

## ✨ Features

* **♟️ FIDE-Compliant Matchmaking:** Dynamically generates TRF (Tournament Report Format) files via the **JaVaFo engine** to compute mathematically accurate Swiss and Round-Robin pairings.
* **📊 Live FIDE Tiebreaker Leaderboards:** Real-time calculation of advanced FIDE metrics including *Buchholz, Buchholz Cut 1 & 2, Buchholz Median, Sonneborn-Berger,* and *Direct Encounters*.
* **🎫 QR Code Check-In System:** Players receive unique Ticket Tokens (QR Codes) generated upon registration. On-site staff can instantly check players in using an in-browser camera scanner.
* **🛡️ Role-Based Access Control (RBAC):** Strict security boundaries separating Admins, Organizers, Staff, and Players via stateless JWTs.
* **🤝 Club Management & Private Tournaments:** Users can create/join clubs via invite codes, view club leaderboards, and host private intra-club tournaments.
* **✉️ OTP Email Verification:** Secure 2-step user onboarding and registration flow.

---

## 💻 Tech Stack

### Frontend
* **Core:** React 19, TypeScript, Vite
* **State & Data Fetching:** TanStack Query (React Query) for server-state caching & polling, Zustand for local state.
* **Styling & UI:** Tailwind CSS v4, Lucide Icons, Headless UI concepts.
* **Tools:** `@yudiel/react-qr-scanner` for device camera integration, `qrcode.react`.

### Backend
* **Core:** Java 21, Spring Boot 3.x, Spring WebMVC
* **Security:** Spring Security, JWT (JSON Web Tokens), BCrypt.
* **Data Access:** Spring Data JPA, Hibernate.
* **External Engine:** JaVaFo (Official FIDE Swiss Engine).

### Infrastructure & DevOps
* **Databases:** PostgreSQL (Serverless via Neon), Redis (Upstash).
* **API Protection:** Bucket4j (Token-bucket rate limiting).
* **Hosting:** Render (Backend), Netlify (Frontend CDN).
* **API Docs:** Swagger / OpenAPI 3.0.

---

## 🏛 System Architecture & Engineering

During development, several complex engineering challenges were solved to ensure production-readiness:

### 1. High-Performance Live Leaderboards
Calculating opponent-based tiebreakers (like Buchholz) requires querying the results of *every opponent* a player has faced. Doing this on every page refresh for a 200-player tournament is computationally heavy.
* **Solution:** Aggressive **Redis Caching**. The leaderboard is cached in Redis and only invalidated/evicted precisely when a staff member successfully submits a match result (`PATCH /api/tournaments/{id}/games/{gameId}/result`).

### 2. "Fail-Open" Rate Limiting
To prevent API abuse, **Bucket4j + Redis** was implemented via a custom `OncePerRequestFilter`. 
* **Solution:** Categorized traffic shaping restricts heavy endpoints (like `/generate`) to 5 req/min, while public endpoints allow 50 req/min. Crucially, it utilizes a **Fail-Open design**: if the Redis server goes down, the filter catches the exception and allows the request to proceed, ensuring High Availability (HA) over strict throttling.

### 3. Mitigating N+1 Client Fetching
* **The Problem:** The frontend initially attempted to fetch all potential tournament rounds concurrently to build the UI, resulting in heavy DB load and redundant 404s.
* **Solution:** Upgraded the Backend DTO to return a `currentRound` tracker. The React Query frontend was re-architected to utilize lazy, on-demand fetching, strictly bounding API calls to the exact round currently being viewed by the user.

---

## 📱 Screenshots

<div align="center">
  <table>
    <tr>
      <td align="center">
        <!--[IMAGE PLACEHOLDER: Insert a screenshot of the Organizer Dashboard showing tournament cards] -->
        <br /><b>Organizer Dashboard</b>
      </td>
      <td align="center">
        <!-- [IMAGE PLACEHOLDER: Insert a screenshot of the Live Leaderboard showing FIDE columns] -->
        <br /><b>Live Leaderboard</b>
      </td>
    </tr>
    <tr>
      <td align="center">
        <!-- [IMAGE PLACEHOLDER: Insert a screenshot of the Staff Panel showing the Match Pairings and Score dropdowns] -->
        <br /><b>Match Results Entry</b>
      </td>
      <td align="center">
        <!--[IMAGE PLACEHOLDER: Insert a screenshot of the Mobile UI showing the QR Scanner component] -->
        <br /><b>In-Browser QR Scanner</b>
      </td>
    </tr>
  </table>
</div>

---

## 🚀 Getting Started

Want to run OrgCheszer locally? Follow these steps:

### Prerequisites
* **Java 21** and Maven
* **Node.js** (v20+) and npm
* **PostgreSQL** installed and running
* **Redis** installed and running (or use a free Upstash URI)

### Backend Setup
1. Clone the repository and navigate to the backend folder:
   ```bash
   git clone https://github.com/YourUsername/OrgCheszer.git
   cd OrgCheszer/backend
   ```
2. Configure your database and email credentials in `src/main/resources/application.yaml`.
3. Run the Spring Boot application:
   ```bash
   ./mvnw spring-boot:run
   ```
   *The backend will start on `http://localhost:8080`. API documentation is available at `http://localhost:8080/swagger-ui.html`.*

### Frontend Setup
1. Open a new terminal and navigate to the frontend folder:
   ```bash
   cd OrgCheszer/frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the root of the frontend folder and add your backend URL:
   ```env
   VITE_API_URL=http://localhost:8080
   ```
4. Start the Vite development server:
   ```bash
   npm run dev
   ```

---

## 🤝 Contributing
Contributions, issues, and feature requests are highly welcome! Feel free to check the [issues page](https://github.com/YourUsername/OrgCheszer/issues).

## 📄 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---
<div align="center">
  Developed by <a href="https://github.com/ManishBera05">Manish Bera</a>
</div>
