import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "./User.js";

@Entity('metas')
export class Meta {

    @PrimaryGeneratedColumn()
    id!: number;

    // RELACIÓN: muchas metas pertenecen a un usuario
    @ManyToOne(() => User, { nullable: false, onDelete: "RESTRICT" })
    @JoinColumn({ name: "usuario_id" })
    usuario!: User;

    @Column({ type: "int" })
    usuario_id!: number;

    @Column({ type: "int" })
    pausas_objetivo!: number;

    // Las columnas DATE de PostgreSQL llegan como texto "YYYY-MM-DD"
    @Column({ type: "date" })
    fecha_inicio!: string;

    @Column({ type: "date" })
    fecha_fin!: string;

    @Column({ type: "enum", enum: ["en_curso", "cumplida", "vencida"], default: "en_curso" })
    estado!: "en_curso" | "cumplida" | "vencida";

    @Column({ type: "boolean", default: true })
    activo!: boolean;

    @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
    created_at!: Date;
}
