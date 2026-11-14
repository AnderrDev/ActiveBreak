import { Column, Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from "typeorm";
import { User } from "./User.js";

@Entity('recordatorios')
export class Recordatorio {

    @PrimaryGeneratedColumn()
    id!: number;

    //RELACIÓN: muchos recordatorios pertenecen a un usuario
    @ManyToOne(() => User)
    @JoinColumn({ name: "usuario_id" })
    usuario!: User;

    @Column({ type: "int" })
    frecuencia_minutos!: number;

    @Column({ type: "time" })
    hora_inicio!: string;

    @Column({ type: "time" })
    hora_fin!: string;

    @Column({ type: "boolean", default: true })
    activo!: boolean;

    @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
    created_at!: Date;
}