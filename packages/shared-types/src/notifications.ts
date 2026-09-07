/**
 * What a notification is about.
 *
 * It decides the icon in the list and how full the card is: a reminder is a
 * line of text, a system message can carry a subtitle, a bullet list and an
 * action (inbox FR-005).
 */
export enum NotificationType {
    Reminder = 'reminder',
    System = 'system',
    Subscription = 'subscription',
}
