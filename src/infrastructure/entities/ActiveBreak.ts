import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { BreakCategory } from "./BreakCategory.js";

@Entity("active_breaks")
export class ActiveBreak {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: "varchar", length: 100 })
    name!: string;

    @Column({ type: "text", nullable: true })
    description!: string | null;

    @Column({ type: "int" })
    duration_minutes!: number;

    @Column({ type: "enum", enum: ["low", "medium", "high"] })
    intensity!: "low" | "medium" | "high";

    // RELATION: many breaks belong to one category
    @ManyToOne(() => BreakCategory, { nullable: false, onDelete: "RESTRICT" })
    @JoinColumn({ name: "category_id" })
    category!: BreakCategory;

    @Column({ type: "int" })
    category_id!: number;

    @Column({ type: "boolean", default: true })
    active!: boolean;

    @CreateDateColumn({ type: "timestamp" })
    created_at!: Date;
}
