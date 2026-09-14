package fr.vestalog.api.service;

import fr.vestalog.api.repository.MagicLinkRepository;
import fr.vestalog.api.repository.RefreshTokenRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.time.ZoneId;

@Component
@RequiredArgsConstructor
public class CleanupScheduler {

    private final RefreshTokenRepository refreshTokenRepository;
    private final MagicLinkRepository magicLinkRepository;

    @Scheduled(cron = "0 0 * * * *")
    public void purgeExpiredRefreshTokens() {
        refreshTokenRepository.deleteAllExpiredBefore(LocalDateTime.now(ZoneId.of("Europe/Paris")));
    }

    @Scheduled(cron = "0 30 * * * *")
    public void purgeExpiredMagicLinks() {
        magicLinkRepository.deleteExpiredAndUsed(LocalDateTime.now(ZoneId.of("Europe/Paris")));
    }
}
