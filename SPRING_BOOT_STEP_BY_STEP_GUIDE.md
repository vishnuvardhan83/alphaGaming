# Complete Step-by-Step Guide: Migrating Express.js to Java Spring Boot with MySQL

This guide will walk you through building your backend using **Java 21**, **Spring Boot 3**, **Spring Data JPA**, and **MySQL** on your own. It translates every concept and pattern from your Node.js/Express app (`server/index.js` & `server/db.js`) into clean, idiomatic Spring Boot.

---

## 1. Mental Model: Express vs Spring Boot

| Concept | Express.js (Node.js) | Spring Boot (Java) |
| :--- | :--- | :--- |
| **Language & Typing** | JavaScript (Dynamic, runtime errors) | Java 21 (Strongly typed, compile-time safety, records) |
| **Entry Point** | `node server/index.js` | `@SpringBootApplication` class with `main()` method |
| **Architecture** | Flat or unstructured routes + helper functions | Layered: `Controller` ➔ `Service` ➔ `Repository` ➔ `Entity` |
| **Routing** | `app.get('/api/games', (req, res) => ...)` | `@RestController` + `@GetMapping("/api/games")` |
| **Request Parsing** | `req.body`, `req.params`, `req.query` | `@RequestBody`, `@PathVariable`, `@RequestParam` |
| **Data Access** | Raw SQL queries via `db.all()`, `db.run()` | Spring Data JPA (`JpaRepository<Entity, ID>`) |
| **DB Migrations** | Custom `CREATE TABLE IF NOT EXISTS` in code | **Flyway** (`src/main/resources/db/migration/V1__*.sql`) |
| **Security / Auth** | Custom middleware `auth(req, res, next)` | `SecurityFilterChain` + `OncePerRequestFilter` |
| **Password Hashing**| `bcrypt.hash()` / `bcrypt.compare()` | `BCryptPasswordEncoder` bean |
| **Error Handling** | `try / catch` + `res.status(500).json(...)` | `@RestControllerAdvice` + `@ExceptionHandler` |
| **File Uploads** | `multer` | `MultipartFile` parameter in controller |

---

## 2. Prerequisites & Environment Setup

### 2.1 Software Needed
1. **Java JDK 21**: Verify with:
   ```bash
   java -version
   ```
2. **Apache Maven 3.9+**: Verify with:
   ```bash
   mvn -version
   ```
3. **MySQL 8+** (or Docker):
   You can run MySQL in Docker using the existing [docker-compose.yml](file:///Users/ent-0439/Downloads/alphaq-gaming-ai-skills/backend/docker-compose.yml):
   ```bash
   cd backend
   docker compose up -d
   ```
   *Port: `3307`, Database: `alphaq_gaming`, User: `alphaq`, Password: `alphaq_dev_pw`*

---

## 3. Project Structure & Dependency Setup

A standard Spring Boot project follows this structure:

```
backend/
├── pom.xml
├── src/
│   ├── main/
│   │   ├── java/com/alphaq/gaming/
│   │   │   ├── AlphaqGamingApplication.java    # Main entry point
│   │   │   ├── config/                         # Security, CORS, Beans
│   │   │   ├── common/                         # Exceptions, Audit, Utils
│   │   │   ├── auth/                           # User, Role, OTP, JWT
│   │   │   ├── catalogue/                      # Games, Setups, Pricing
│   │   │   ├── booking/                        # Bookings & Slot engine
│   │   │   ├── food/                           # Food items & Orders
│   │   │   ├── tournament/                     # Tournaments & Signups
│   │   │   ├── review/                         # Customer reviews
│   │   │   ├── gallery/                        # Photos & Uploads
│   │   │   ├── reward/                         # Points & Rewards history
│   │   │   └── admin/                          # Dashboard & Admin APIs
│   │   └── resources/
│   │       ├── application.yml                 # Database & App config
│   │       └── db/migration/                   # Flyway SQL migrations
```

### 3.1 Maven Dependencies (`pom.xml`)
Your `pom.xml` needs:
- `spring-boot-starter-web` (REST APIs)
- `spring-boot-starter-security` (Auth & authorization)
- `spring-boot-starter-data-jpa` (Hibernate & Database access)
- `spring-boot-starter-validation` (Bean validation: `@NotNull`, `@Email`, etc.)
- `flyway-core` & `flyway-mysql` (Versioned database migrations)
- `mysql-connector-j` (MySQL JDBC driver)
- `jjwt-api`, `jjwt-impl`, `jjwt-jackson` (JWT creation & parsing)

### 3.2 Configuration (`src/main/resources/application.yml`)
```yaml
spring:
  application:
    name: alphaq-gaming
  datasource:
    url: ${DB_URL:jdbc:mysql://localhost:3307/alphaq_gaming?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=Asia/Kolkata}
    username: ${DB_USERNAME:alphaq}
    password: ${DB_PASSWORD:alphaq_dev_pw}
  jpa:
    hibernate:
      ddl-auto: validate   # Flyway creates tables; Hibernate only validates schema
    open-in-view: false
  flyway:
    enabled: true
    baseline-on-migrate: true
    locations: classpath:db/migration

server:
  port: ${SERVER_PORT:8080}

alphaq:
  jwt:
    secret: ${APP_JWT_SECRET:your-super-secret-key-at-least-32-chars-long}
    ttl-minutes: 720
```

---

## 4. Step-by-Step Implementation Flow

To build any feature on your own, always follow this **bottom-up 5-step flow**:

```mermaid
graph LR
  A[1. Flyway SQL] --> B[2. JPA Entity]
  B --> C[3. Spring Data Repository]
  C --> D[4. DTOs & Service Logic]
  D --> E[5. REST Controller]
```

---

## Step 1: Database Migrations (Flyway)

Instead of running raw SQL in JavaScript, create incremental migration files in `src/main/resources/db/migration/`:

**File: `V1__init_schema.sql`**
```sql
CREATE TABLE users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(190) UNIQUE,
    phone VARCHAR(32) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    role VARCHAR(32) NOT NULL DEFAULT 'USER',
    points INT NOT NULL DEFAULT 0,
    blocked BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE games (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(190) NOT NULL,
    platform JSON,
    tags JSON,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INT NOT NULL DEFAULT 0
);
```

---

## Step 2: Define JPA Entities

Convert your tables into Java classes.

**Example: `Game.java`**
```java
package com.alphaq.gaming.catalogue.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "games")
public class Game {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "json")
    private String platform; // Stored as JSON string or parsed via converter

    @Column(columnDefinition = "json")
    private String tags;

    @Column(nullable = false)
    private boolean active = true;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder = 0;

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
    public int getSortOrder() { return sortOrder; }
    public void setSortOrder(int sortOrder) { this.sortOrder = sortOrder; }
}
```

---

## Step 3: Create Repositories

In Express, you wrote `db.all("SELECT * FROM games WHERE active = 1 ORDER BY sort_order")`.
In Spring Data JPA, you just write an interface:

**Example: `GameRepository.java`**
```java
package com.alphaq.gaming.catalogue.repo;

import com.alphaq.gaming.catalogue.entity.Game;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface GameRepository extends JpaRepository<Game, Long> {
    // Spring generates the SQL query automatically based on method name!
    List<Game> findByActiveTrueOrderBySortOrderAsc();
}
```

---

## Step 4: Write DTOs and Service Logic

**DTOs (Data Transfer Objects)** decouple your database model from your API response. Use Java `record`:

**Example: `GameDto.java`**
```java
package com.alphaq.gaming.catalogue.dto;

import java.util.List;

public record GameDto(
    String id,
    String title,
    List<String> platform,
    List<String> tags,
    boolean active,
    int sortOrder
) {}
```

**Example: `CatalogueService.java`**
```java
package com.alphaq.gaming.catalogue.service;

import com.alphaq.gaming.catalogue.entity.Game;
import com.alphaq.gaming.catalogue.repo.GameRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
public class CatalogueService {

    private final GameRepository gameRepository;

    public CatalogueService(GameRepository gameRepository) {
        this.gameRepository = gameRepository;
    }

    @Transactional(readOnly = true)
    public List<Game> listActiveGames() {
        return gameRepository.findByActiveTrueOrderBySortOrderAsc();
    }
}
```

---

## Step 5: Create REST Controllers

Replace Express route handlers with `@RestController`.

**Express Code:**
```js
app.get("/api/games", async (req, res) => {
  const games = await db.all("SELECT * FROM games WHERE active = 1 ORDER BY sort_order");
  res.json({ games: games.map(toGame) });
});
```

**Spring Boot Equivalent: `PublicCatalogueController.java`**
```java
package com.alphaq.gaming.catalogue.web;

import com.alphaq.gaming.catalogue.entity.Game;
import com.alphaq.gaming.catalogue.service.CatalogueService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class PublicCatalogueController {

    private final CatalogueService catalogueService;

    public PublicCatalogueController(CatalogueService catalogueService) {
        this.catalogueService = catalogueService;
    }

    @GetMapping("/games")
    public ResponseEntity<?> getGames() {
        List<Game> games = catalogueService.listActiveGames();
        return ResponseEntity.ok(Map.of("games", games));
    }
}
```

---

## 5. Security & Authentication: Converting Express JWT to Spring Security

In Express you had:
```js
const payload = jwt.verify(token, JWT_SECRET);
const u = await db.get("SELECT * FROM users WHERE id = ?", [payload.id]);
```

In Spring Boot, implement this using a **OncePerRequestFilter**:

### 5.1 The JWT Filter (`JwtAuthFilter.java`)
```java
@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserRepository userRepository;

    public JwtAuthFilter(JwtService jwtService, UserRepository userRepository) {
        this.jwtService = jwtService;
        this.userRepository = userRepository;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = authHeader.substring(7);
        if (jwtService.validateToken(token)) {
            Long userId = jwtService.extractUserId(token);
            User user = userRepository.findById(userId).orElse(null);

            if (user != null && !user.isBlocked()) {
                var auth = new UsernamePasswordAuthenticationToken(
                    user, null, List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole()))
                );
                SecurityContextHolder.getContext().setAuthentication(auth);
            }
        }
        filterChain.doFilter(request, response);
    }
}
```

### 5.2 Security Configuration (`SecurityConfig.java`)
```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;

    public SecurityConfig(JwtAuthFilter jwtAuthFilter) {
        this.jwtAuthFilter = jwtAuthFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // Public endpoints
                .requestMatchers("/api/auth/**", "/api/games", "/api/food", "/api/reviews").permitAll()
                // Admin-only endpoints
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                // User-authenticated endpoints
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
```

---

## 6. Detailed Module-by-Module Conversion Guide

### 6.1 User Auth & OTP
| Express Endpoint | Spring Controller Method | Notes |
| :--- | :--- | :--- |
| `POST /api/auth/register` | `authController.register(RegisterDto)` | Hash password with `passwordEncoder.encode()` |
| `POST /api/auth/login` | `authController.login(LoginDto)` | Check with `passwordEncoder.matches()` & return JWT |
| `POST /api/auth/send-otp` | `authController.sendOtp(OtpRequestDto)` | Generate 6-digit OTP, save to DB with expiry |
| `POST /api/auth/verify-otp`| `authController.verifyOtp(VerifyDto)` | Invalidate OTP after use, issue token |
| `GET /api/auth/me` | `authController.me(@AuthenticationPrincipal User u)` | Injected automatically from Spring Security context |

### 6.2 Bookings & Slot Availability Engine
- **Slot Conflict Query in JPA**:
  ```java
  @Query("""
    SELECT COUNT(b) > 0 FROM Booking b
    WHERE b.platform = :platform
      AND b.date = :date
      AND b.slot = :slot
      AND b.status IN ('PENDING', 'CONFIRMED')
  """)
  boolean isSlotOccupied(@Param("platform") String platform,
                         @Param("date") LocalDate date,
                         @Param("slot") String slot);
  ```
- **Scheduled Expiration**:
  In Express, you ran periodic cleanup timers. In Spring Boot, enable `@EnableScheduling` and write:
  ```java
  @Component
  public class BookingExpiryJob {
      @Scheduled(fixedRate = 60000) // runs every minute
      @Transactional
      public void expireUnpaidBookings() {
          LocalDateTime threshold = LocalDateTime.now().minusMinutes(5);
          bookingRepository.expirePendingOlderThan(threshold);
      }
  }
  ```

### 6.3 Food Menu & Orders
- **Entity**: `FoodItem` (id, name, category, price, image, active, sortOrder)
- **Order Entity**: `FoodOrder` with status (`PLACED`, `PREPARING`, `DELIVERED`, `CANCELLED`).
- **Endpoint**:
  - `GET /api/food` ➔ Public menu
  - `POST /api/food/order` ➔ Create order (authenticated)
  - `GET /api/food/orders/my` ➔ User's past food orders

### 6.4 Tournaments & Signups
- **Entity**: `Tournament` (game, format, date, prize, status, capacity)
- **Entity**: `TournamentRegistration` (tournamentId, userId, teamName, registeredAt)
- **Capacity Check in Service**:
  ```java
  long count = registrationRepository.countByTournamentId(tournamentId);
  if (count >= tournament.getCapacity()) {
      throw new ApiException("Tournament is full", HttpStatus.BAD_REQUEST);
  }
  ```

### 6.5 Customer Reviews
- **Table**: `reviews` with boolean `approved`
- User submits ➔ `approved = false`
- Admin calls `POST /api/admin/reviews/{id}/approve` ➔ `approved = true`
- Public endpoint `GET /api/reviews` only queries `findByApprovedTrueOrderByCreatedAtDesc()`.

### 6.6 File Uploads (Multer replacement)
Express used `multer({ storage: diskStorage })`. In Spring Boot:
```java
@PostMapping("/api/admin/gallery/upload")
public ResponseEntity<?> uploadImage(@RequestParam("file") MultipartFile file,
                                     @RequestParam("caption") String caption) throws IOException {
    String filename = UUID.randomUUID() + "_" + file.getOriginalFilename();
    Path targetPath = Paths.get("uploads").resolve(filename);
    Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);

    GalleryImage image = galleryService.save("/uploads/" + filename, caption);
    return ResponseEntity.ok(image);
}
```

---

## 7. Global Exception Handling

In Express, unhandled errors crash the process or require `next(err)`.
In Spring Boot, handle them cleanly using `@RestControllerAdvice`:

```java
package com.alphaq.gaming.common.error;

import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ApiException.class)
    public ResponseEntity<?> handleApiException(ApiException ex) {
        return ResponseEntity.status(ex.getStatus()).body(Map.of("error", ex.getMessage()));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<?> handleGenericException(Exception ex) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                             .body(Map.of("error", "An unexpected error occurred."));
    }
}
```

---

## 8. Step-by-Step Build and Run Checklist

1. **Start MySQL Database**:
   ```bash
   cd backend
   docker compose up -d
   ```
2. **Build and Validate with Maven**:
   ```bash
   mvn clean compile
   ```
3. **Run Application**:
   ```bash
   mvn spring-boot:run
   ```
4. **Verify Application**:
   - Check Flyway migrations executed in terminal: `Successfully applied 4 migrations`.
   - Test a public endpoint with curl:
     ```bash
     curl http://localhost:8080/api/games
     ```
   - Test user registration / login:
     ```bash
     curl -X POST http://localhost:8080/api/auth/login \
          -H "Content-Type: application/json" \
          -d '{"phone":"9573976462","password":"password123"}'
     ```

---

## 9. Summary & Next Steps
You have an existing Spring Boot skeleton ready in the [backend/](file:///Users/ent-0439/Downloads/alphaq-gaming-ai-skills/backend) directory!
You can build out the remaining modules (`Food`, `Tournaments`, `Reviews`, `Gallery`, `Rewards`) one by one following the **Flyway ➔ Entity ➔ Repository ➔ Service ➔ Controller** blueprint.
