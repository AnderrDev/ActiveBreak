import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("break_categories")
export class BreakCategory {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: "varchar", length: 60, unique: true })
    name!: string;

    @Column({ type: "text", nullable: true })
    description!: string | null;

    @Column({ type: "boolean", default: true })
    active!: boolean;

    @CreateDateColumn({ type: "timestamp" })
    created_at!: Date;
}
