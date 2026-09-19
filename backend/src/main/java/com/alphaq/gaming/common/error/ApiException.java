package com.alphaq.gaming.common.error;

import org.springframework.http.HttpStatus;

/** Domain exception carrying an HTTP status + a safe, user-facing message. */
public class ApiException extends RuntimeException {

    private final HttpStatus status;

    public ApiException(HttpStatus status, String message) {
        super(message);
        this.status = status;
    }

    public HttpStatus getStatus() { return status; }

    public static ApiException badRequest(String msg)  { return new ApiException(HttpStatus.BAD_REQUEST, msg); }
    public static ApiException conflict(String msg)    { return new ApiException(HttpStatus.CONFLICT, msg); }
    public static ApiException unauthorized(String msg){ return new ApiException(HttpStatus.UNAUTHORIZED, msg); }
    public static ApiException tooMany(String msg)     { return new ApiException(HttpStatus.TOO_MANY_REQUESTS, msg); }
    public static ApiException notFound(String msg)    { return new ApiException(HttpStatus.NOT_FOUND, msg); }
}
