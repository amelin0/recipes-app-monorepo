/**
 * How far a plan may reach.
 *
 * Wider into the future than the log window, and for the opposite reason: the
 * log's window guards against a device with a broken clock reporting a meal
 * eaten next month, while a plan for next month is the point of planning. The
 * bound is still there so a single request cannot address a decade.
 */
export const MEAL_PLAN_WINDOW_DAYS = Object.freeze({
    past: 365,
    future: 365,
});

/** One request asks for what the week strip shows, not for a year of it. */
export const MEAL_PLAN_MAX_RANGE_DAYS = 31;

/** The sheet offers this week and the next, so fourteen is the whole of what it can select. */
export const MEAL_PLAN_MAX_COPY_TARGETS = 14;
