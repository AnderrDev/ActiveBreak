import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from "typeorm";
import { Reminder } from "./Reminder.js";
import type { Weekday } from "../../domain/ReminderDay.js";

// A reminder cannot have the same weekday twice (also enforced by the database)
@Entity("reminder_days")
@Unique("UQ_reminder_days_reminder_weekday", ["reminder_id", "weekday"])
export class ReminderDay {
    @PrimaryGeneratedColumn()
    id!: number;

    // RELATION: many days belong to one reminder
    @ManyToOne(() => Reminder, { nullable: false, onDelete: "RESTRICT" })
    @JoinColumn({ name: "reminder_id" })
    reminder!: Reminder;

    @Column({ type: "int" })
    reminder_id!: number;

    @Column({ type: "enum", enum: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] })
    weekday!: Weekday;
}
