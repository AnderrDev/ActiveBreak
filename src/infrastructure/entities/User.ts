import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Organization } from "./Organization.js";

@Entity("users")
export class User {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: "varchar", length: 150 })
    name!: string;

    @Column({ type: "varchar", length: 150, unique: true })
    email!: string;

    @Column({ type: "varchar", length: 255 })
    password_hash!: string;

    @Column({ type: "enum", enum: ["user", "admin"], default: "user" })
    role!: "user" | "admin";

    @Column({ type: "enum", enum: ["low", "medium", "high"], default: "medium" })
    health_level!: "low" | "medium" | "high";

    @Column({ type: "boolean", default: true })
    active!: boolean;

    // RELATION: many users belong to one organization (assigned by an admin, optional)
    @ManyToOne(() => Organization, { nullable: true, onDelete: "RESTRICT" })
    @JoinColumn({ name: "organization_id" })
    organization!: Organization | null;

    @Column({ type: "int", nullable: true })
    organization_id!: number | null;

    @CreateDateColumn({ type: "timestamp" })
    created_at!: Date;

    @UpdateDateColumn({ type: "timestamp" })
    updated_at!: Date;
}
