import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "./User.js";
import { ActiveBreak } from "./ActiveBreak.js";

// Insert-only log of the breaks performed (physical delete, no "active" column)
@Entity("activity_history")
export class ActivityHistory {
    @PrimaryGeneratedColumn()
    id!: number;

    // RELATION: many records belong to one user
    @ManyToOne(() => User, { nullable: false, onDelete: "RESTRICT" })
    @JoinColumn({ name: "user_id" })
    user!: User;

    @Column({ type: "int" })
    user_id!: number;

    // RELATION: many records reference one break
    @ManyToOne(() => ActiveBreak, { nullable: false, onDelete: "RESTRICT" })
    @JoinColumn({ name: "break_id" })
    activeBreak!: ActiveBreak;

    @Column({ type: "int" })
    break_id!: number;

    @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
    performed_at!: Date;

    @Column({ type: "boolean", default: true })
    completed!: boolean;

    @Column({ type: "int", default: 0 })
    actual_duration_minutes!: number;
}
