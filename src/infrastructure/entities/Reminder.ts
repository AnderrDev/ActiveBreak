import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "./User.js";

@Entity("reminders")
export class Reminder {
    @PrimaryGeneratedColumn()
    id!: number;

    // RELATION: many reminders belong to one user
    @ManyToOne(() => User, { nullable: false, onDelete: "RESTRICT" })
    @JoinColumn({ name: "user_id" })
    user!: User;

    @Column({ type: "int" })
    user_id!: number;

    @Column({ type: "int" })
    frequency_minutes!: number;

    @Column({ type: "time" })
    start_time!: string;

    @Column({ type: "time" })
    end_time!: string;

    @Column({ type: "boolean", default: true })
    active!: boolean;

    @CreateDateColumn({ type: "timestamp" })
    created_at!: Date;
}
