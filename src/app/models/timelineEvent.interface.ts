import { EventType } from "./enums/eventType.enum";
import { User } from "./user.interface";

export interface TimelineEvent {
    id: number;
    user: User; // User who created the event
    content: string; // Content of the event
    type: EventType; // Type of event (enum)
    creationDate: string; // Creation date in ISO format
    solicitationId: number; // Associated solicitation ID
}