package fr.vestalog.api.exception;

public class MailDeliveryException extends RuntimeException {
    public MailDeliveryException(String msg, Throwable cause) {
        super(msg, cause);
    }
}
