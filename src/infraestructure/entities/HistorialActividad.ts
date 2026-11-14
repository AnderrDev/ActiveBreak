import { Column, Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from "typeorm";
import { User } from "./User.js";
import { PausaActiva } from "./PausaActiva.js";

@Entity('historial_actividad')
export class HistorialActividad {

    @PrimaryGeneratedColumn()
    id!: number;

    // relación con usuario
    @ManyToOne(() => User)
    @JoinColumn({ name: "usuario_id" })
    usuario!: User;

    // relación con pausa activa
    @ManyToOne(() => PausaActiva)
    @JoinColumn({ name: "pausa_id" })
    pausa!: PausaActiva;

    @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
    fecha_hora!: Date;

    @Column({ type: "boolean", default: true })
    completado!: boolean;

    @Column({ type: "int", default: 0 })
    duracion_real!: number;
}