import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('organizaciones')
export class Organizacion {

    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: "character varying", length: 120 })
    nombre!: string;

    @Column({ type: "character varying", length: 15, unique: true })
    nit!: string;

    @Column({ type: "character varying", length: 80, nullable: true })
    sector!: string | null;

    @Column({ type: "boolean", default: true })
    activo!: boolean;

    @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
    created_at!: Date;
}
