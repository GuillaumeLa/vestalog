package fr.vestalog.api.controller;

import fr.vestalog.api.dto.auth.AuthResponse;
import fr.vestalog.api.dto.auth.AuthServiceResult;
import fr.vestalog.api.dto.auth.LoginRequest;
import fr.vestalog.api.dto.auth.TokenVerifyRequest;
import fr.vestalog.api.exception.MailDeliveryException;
import fr.vestalog.api.service.AuthService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Arrays;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @Value("${jwt.refresh-expiration-ms}")
    private long refreshExpirationMs;

    @Value("${server.cookie.secure:false}")
    private boolean secureCookie;

    private static final String REFRESH_COOKIE = "refreshToken";

    @ExceptionHandler(MailDeliveryException.class)
    public ResponseEntity<Map<String, String>> handleMailDeliveryException(MailDeliveryException ex) {
        return ResponseEntity.status(503).body(Map.of("message", "Le service d'envoi d'email est temporairement indisponible. Réessayez dans quelques instants."));
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String, String>> login(@Valid @RequestBody LoginRequest request) {
        authService.sendMagicLink(request.email());
        return ResponseEntity.ok(Map.of("message", "Lien de connexion envoyé à " + request.email()));
    }

    @PostMapping("/verify")
    public ResponseEntity<AuthResponse> verify(
            @Valid @RequestBody TokenVerifyRequest request,
            HttpServletResponse response) {
        AuthServiceResult result = authService.verifyMagicToken(request.token());
        setRefreshCookie(response, result.rawRefreshToken());
        return ResponseEntity.ok(result.authResponse());
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refresh(HttpServletRequest request, HttpServletResponse response) {
        AuthServiceResult result = authService.refresh(extractRefreshCookie(request));
        setRefreshCookie(response, result.rawRefreshToken());
        return ResponseEntity.ok(result.authResponse());
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletRequest request, HttpServletResponse response) {
        try {
            authService.logout(extractRefreshCookie(request));
        } catch (ResponseStatusException ignored) {
            // No cookie = already logged out — idempotent 204
        }
        clearRefreshCookie(response);
        return ResponseEntity.noContent().build();
    }

    private void setRefreshCookie(HttpServletResponse response, String rawToken) {
        Cookie cookie = new Cookie(REFRESH_COOKIE, rawToken);
        cookie.setHttpOnly(true);
        cookie.setPath("/api/auth");
        cookie.setMaxAge((int) (refreshExpirationMs / 1000));
        cookie.setSecure(secureCookie);
        cookie.setAttribute("SameSite", "Lax");
        response.addCookie(cookie);
    }

    private void clearRefreshCookie(HttpServletResponse response) {
        Cookie cookie = new Cookie(REFRESH_COOKIE, "");
        cookie.setHttpOnly(true);
        cookie.setPath("/api/auth");
        cookie.setMaxAge(0);
        cookie.setSecure(secureCookie);
        cookie.setAttribute("SameSite", "Lax");
        response.addCookie(cookie);
    }

    private String extractRefreshCookie(HttpServletRequest request) {
        if (request.getCookies() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Refresh token manquant");
        }
        return Arrays.stream(request.getCookies())
                .filter(c -> REFRESH_COOKIE.equals(c.getName()))
                .map(Cookie::getValue)
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Refresh token manquant"));
    }
}
