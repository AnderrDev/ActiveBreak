import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("organizations")
export class Organization {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: "varchar", length: 120 })
    name!: string;

    // Colombian NIT, unique
    @Column({ type: "varchar", length: 15, unique: true })
    tax_id!: string;

    @Column({ type: "varchar", length: 80, nullable: true })
    sector!: string | null;

    @Column({ type: "boolean", default: true })
    active!: boolean;

    @CreateDateColumn({ type: "timestamp" })
    created_at!: Date;
}
