import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('categorias_pausa')
export class CategoriaPausa {

    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: "character varying", length: 60, unique: true })
    nombre!: string;

    @Column({ type: "text", nullable: true })
    descripcion!: string | null;

    @Column({ type: "boolean", default: true })
    activo!: boolean;

    @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
    created_at!: Date;
}
