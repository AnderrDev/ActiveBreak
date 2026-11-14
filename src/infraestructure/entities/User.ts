import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('usuarios')
export class User {

    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: "character varying", length: 100 })
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

    @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
    created_at!: Date;

    @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
    updated_at!: Date;
}