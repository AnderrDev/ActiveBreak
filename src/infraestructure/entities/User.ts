import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Organizacion } from "./Organizacion.js";

@Entity('usuarios')
export class User {

    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: "character varying", length: 150 })
    nombre!: string;

    @Column({ type: "character varying", length: 150, unique: true })
    correo!: string;

    @Column({ type: "character varying", length: 255 })
    contrasena_hash!: string;

    @Column({ type: "enum", enum: ["usuario", "admin"] })
    rol!: "usuario" | "admin";

    @Column({ type: "character varying", length: 20, default: "medio" })
    nivel_salud!: string;

    @Column({ type: "boolean", default: true })
    activo!: boolean;

    // RELACIÓN: muchos usuarios pertenecen a una organización (la asigna un admin)
    @ManyToOne(() => Organizacion, { nullable: true, onDelete: "RESTRICT" })
    @JoinColumn({ name: "organizacion_id" })
    organizacion!: Organizacion | null;

    @Column({ type: "int", nullable: true })
    organizacion_id!: number | null;

    @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
    created_at!: Date;

    @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
    updated_at!: Date;
}