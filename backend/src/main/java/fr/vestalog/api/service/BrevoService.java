package fr.vestalog.api.service;

import fr.vestalog.api.exception.MailDeliveryException;
import java.util.List;
import java.util.Map;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

@Service
@Slf4j
public class BrevoService {

    private final RestClient restClient;
    private final String senderEmail;
    private final String senderName;
    private final boolean debugMail;

    public BrevoService(
        @Value("${brevo.api-key}") String apiKey,
        @Value("${brevo.sender-email}") String senderEmail,
        @Value("${brevo.sender-name}") String senderName,
        @Value("${app.debug-mail:false}") boolean debugMail
    ) {
        this.senderEmail = senderEmail;
        this.senderName = senderName;
        this.debugMail = debugMail;
        this.restClient = RestClient.builder()
            .baseUrl("https://api.brevo.com/v3")
            .defaultHeader("api-key", apiKey)
            .defaultHeader(
                HttpHeaders.CONTENT_TYPE,
                MediaType.APPLICATION_JSON_VALUE
            )
            .build();
    }

    public void sendMagicLinkEmail(
        String toEmail,
        String firstName,
        String magicLinkUrl
    ) {
        log.info("Mag link : {}", magicLinkUrl);

        if (debugMail) {
            log.info("[DEBUG-MAIL] Email non envoyé (app.debug-mail=true) — destinataire: {}", toEmail);
            return;
        }

        String htmlContent = buildEmailHtml(firstName, magicLinkUrl);

        Map<String, Object> body = Map.of(
            "sender",
            Map.of("name", senderName, "email", senderEmail),
            "to",
            List.of(Map.of("email", toEmail, "name", firstName)),
            "subject",
            "Votre lien de connexion - VestaLog",
            "htmlContent",
            htmlContent,
            "trackClicks",
            false,
            "trackOpens",
            false
        );

        try {
            restClient
                .post()
                .uri("/smtp/email")
                .body(body)
                .retrieve()
                .toBodilessEntity();
        } catch (Exception e) {
            log.error("Brevo error: {}", e.getMessage());
            throw new MailDeliveryException("Echec envoi email", e);
        }

        log.info("Magic link envoyé à {}", toEmail);
    }

    private String buildEmailHtml(String firstName, String magicLinkUrl) {
        return """
        <!DOCTYPE html>
        <html lang="fr">
        <head><meta charset="UTF-8"></head>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #D9251D;">VestaLog</h1>
          </div>
          <p>Bonjour %s,</p>
          <p>Vous avez demandé à vous connecter. Cliquez sur le bouton ci-dessous pour accéder à votre espace :</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="%s"
               style="background-color: #D9251D; color: white; padding: 14px 28px;
                      text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: bold;">
              Se connecter
            </a>
          </div>
          <p style="color: #666; font-size: 13px;">
            Ce lien est valable <strong>15 minutes</strong> et ne peut être utilisé qu'une seule fois.<br>
            Si vous n'avez pas fait cette demande, ignorez cet email.
          </p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #999; font-size: 12px; text-align: center;">
            VestaLog — communication automatique, ne pas répondre.
          </p>
        </body>
        </html>
        """.formatted(firstName, magicLinkUrl);
    }
}
