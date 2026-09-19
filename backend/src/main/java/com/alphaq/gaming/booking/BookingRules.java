package com.alphaq.gaming.booking;

import java.time.DayOfWeek;
import java.time.LocalTime;

/** Operating constraints from the blueprint (§04/§05). Centralised for reuse. */
public final class BookingRules {
    private BookingRules() {}

    public static final LocalTime OPEN = LocalTime.of(11, 0);
    public static final LocalTime CLOSE = LocalTime.of(20, 0);        // 8:00 PM
    public static final int DAY_MINUTES = 540;                        // 11:00–20:00
    public static final int MIN_DURATION_MIN = 30;
    public static final int BOOKING_WINDOW_DAYS = 7;                  // book up to 7 days ahead
    public static final DayOfWeek WEEKLY_CLOSURE = DayOfWeek.MONDAY;  // closed Mondays
    public static final int HOLD_MINUTES = 10;                        // payment hold window
}
