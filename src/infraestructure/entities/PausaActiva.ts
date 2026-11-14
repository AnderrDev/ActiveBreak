import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('pausas_activas')
export class PausaActiva {

    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: "character varying", length: 100 })
    nombre!: string;

    @Column({ type: "text", nullable: true })
    descripcion!: string | null;

    @Column({ type: "int" })
    duracion_minutos!: number;

    @Column({ type: "enum", enum: ["baja", "media", "alta"] })
    intensidad!: "baja" | "media" | "alta";

    @Column({ type: "boolean", default: true })
    activo!: boolean;

    @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
    created_at!: Date;
}