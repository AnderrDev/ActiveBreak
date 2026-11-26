import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "./User.js";

@Entity("goals")
export class Goal {
    @PrimaryGeneratedColumn()
    id!: number;

    // RELATION: many goals belong to one user
    @ManyToOne(() => User, { nullable: false, onDelete: "RESTRICT" })
    @JoinColumn({ name: "user_id" })
    user!: User;

    @Column({ type: "int" })
    user_id!: number;

    @Column({ type: "int" })
    target_breaks!: number;

    // PostgreSQL DATE columns arrive as "YYYY-MM-DD" strings
    @Column({ type: "date" })
    start_date!: string;

    @Column({ type: "date" })
    end_date!: string;

    @Column({ type: "enum", enum: ["in_progress", "completed", "expired"], default: "in_progress" })
    status!: "in_progress" | "completed" | "expired";

    @Column({ type: "boolean", default: true })
    active!: boolean;

    @CreateDateColumn({ type: "timestamp" })
    created_at!: Date;
}
