package fr.vestalog.api.service;

import fr.vestalog.api.dto.auth.AuthResponse;
import fr.vestalog.api.dto.auth.AuthServiceResult;
import fr.vestalog.api.dto.auth.UserDto;
import fr.vestalog.api.entity.MagicLink;
import fr.vestalog.api.entity.RefreshToken;
import fr.vestalog.api.entity.User;
import fr.vestalog.api.repository.MagicLinkRepository;
import fr.vestalog.api.repository.RefreshTokenRepository;
import fr.vestalog.api.repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Arrays;
import java.util.Base64;
import java.util.Locale;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private static final ZoneId PARIS = ZoneId.of("Europe/Paris");

    private final MagicLinkRepository magicLinkRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final BrevoService brevoService;

    @Value("${magic-link.expiration-ms}")
    private long magicLinkExpirationMs;

    @Value("${jwt.refresh-expiration-ms}")
    private long refreshExpirationMs;

    @Value("${magic-link.base-url}")
    private String frontendBaseUrl;

    @Value("${allowed-domain}")
    private String allowedDomain;

    private String hashToken(String raw) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] hash = md.digest(raw.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 non disponible", e);
        }
    }

    private String[] parseEmailLocalPart(String email) {
        String localPart = email.split("@")[0];
        String[] parts = localPart.split("\\.");
        if (parts.length < 2) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Format d'email attendu : prenom.nom@" + allowedDomain);
        }
        return parts;
    }

    private String capitalize(String s) {
        if (s == null || s.isEmpty()) return s;
        return Character.toUpperCase(s.charAt(0)) + s.substring(1).toLowerCase(Locale.FRENCH);
    }

    private AuthServiceResult buildAuthResult(User user) {
        String accessToken = jwtService.generateAccessToken(user.getEmail());

        String rawRefresh = UUID.randomUUID().toString();
        String hashedRefresh = hashToken(rawRefresh);
        LocalDateTime refreshExpiresAt = LocalDateTime.now(PARIS).plusNanos(refreshExpirationMs * 1_000_000L);
        refreshTokenRepository.save(RefreshToken.builder()
                .token(hashedRefresh)
                .user(user)
                .expiresAt(refreshExpiresAt)
                .revoked(false)
                .build());

        return new AuthServiceResult(new AuthResponse(accessToken, UserDto.from(user)), rawRefresh);
    }

    private User findOrCreateUser(String email) {
        String[] parts = parseEmailLocalPart(email);
        String firstName = capitalize(parts[0]);
        String lastName = capitalize(String.join(" ", Arrays.copyOfRange(parts, 1, parts.length)));
        // Atomic upsert — safe under concurrent verify calls (double-click, browser retry)
        userRepository.insertIfNotExists(email, firstName, lastName);
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Erreur création utilisateur"));
    }

    @Transactional
    public AuthServiceResult verifyMagicToken(String token) {
        // Compare against the stored hash
        MagicLink magicLink = magicLinkRepository.findByToken(hashToken(token))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Lien invalide"));

        if (magicLink.isUsed()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Lien déjà utilisé");
        }
        if (magicLink.getExpiresAt().isBefore(LocalDateTime.now(PARIS))) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Lien expiré");
        }

        magicLink.setUsed(true);
        magicLinkRepository.save(magicLink);

        User user = findOrCreateUser(magicLink.getEmail());
        return buildAuthResult(user);
    }

    @Transactional
    public AuthServiceResult refresh(String rawRefreshToken) {
        String hashed = hashToken(rawRefreshToken);
        RefreshToken refreshToken = refreshTokenRepository.findByToken(hashed)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Refresh token invalide"));

        if (refreshToken.isRevoked()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Refresh token révoqué");
        }
        if (refreshToken.getExpiresAt().isBefore(LocalDateTime.now(PARIS))) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Refresh token expiré");
        }

        // Atomic claim: only one concurrent request can succeed (UPDATE WHERE revoked=false → 1 row).
        // Any parallel refresh with the same token gets 0 rows and is rejected as a replay.
        int claimed = refreshTokenRepository.atomicRevoke(hashed);
        if (claimed == 0) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Refresh token déjà utilisé");
        }

        // Cleanup old revoked tokens using a bulk JPQL DELETE (no "load then delete" → no StaleStateException).
        refreshTokenRepository.deleteAllRevokedByUser(refreshToken.getUser());

        return buildAuthResult(refreshToken.getUser());
    }

    @Transactional
    public void logout(String rawRefreshToken) {
        String hashed = hashToken(rawRefreshToken);
        refreshTokenRepository.findByToken(hashed).ifPresent(rt -> {
            rt.setRevoked(true);
            refreshTokenRepository.save(rt);
        });
    }

    @Transactional
    public void sendMagicLink(String email) {
        if (!email.endsWith("@" + allowedDomain)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Seules les adresses @" + allowedDomain + " sont autorisées");
        }
        String[] parts = parseEmailLocalPart(email);
        String firstName = capitalize(parts[0]);

        magicLinkRepository.invalidatePreviousLinks(email);

        String rawToken = UUID.randomUUID().toString();
        // Store the hash — raw token only travels in the email link, never in the DB
        String hashedToken = hashToken(rawToken);
        LocalDateTime expiresAt = LocalDateTime.now(PARIS).plusNanos(magicLinkExpirationMs * 1_000_000L);
        magicLinkRepository.save(MagicLink.builder()
                .token(hashedToken)
                .email(email)
                .expiresAt(expiresAt)
                .used(false)
                .build());

        String magicLinkUrl = frontendBaseUrl + "/verify?token=" + rawToken;
        brevoService.sendMagicLinkEmail(email, firstName, magicLinkUrl);
    }
}
