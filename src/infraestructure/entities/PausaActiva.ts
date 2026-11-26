import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { CategoriaPausa } from "./CategoriaPausa.js";

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

    // RELACIÓN: muchas pausas pertenecen a una categoría.
    // Es nullable para no romper las pausas creadas antes de existir las categorías;
    // las pausas nuevas la exigen en la validación.
    @ManyToOne(() => CategoriaPausa, { nullable: true, onDelete: "RESTRICT" })
    @JoinColumn({ name: "categoria_id" })
    categoria!: CategoriaPausa | null;

    @Column({ type: "int", nullable: true })
    categoria_id!: number | null;

    @Column({ type: "boolean", default: true })
    activo!: boolean;

    @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
    created_at!: Date;
}