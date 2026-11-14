import { Column, Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from "typeorm";
import { Recordatorio } from "./Recordatorio.js";

@Entity('recordatorio_dias')
export class RecordatorioDia {

    @PrimaryGeneratedColumn()
    id!: number;

    // Relación: muchos registros de días pertenecen a un recordatorio
    @ManyToOne(() => Recordatorio)
    @JoinColumn({ name: "recordatorio_id" })
    recordatorio!: Recordatorio;

    @Column({
        type: "enum",
        enum: ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"]
    })
    dia_semana!: "lunes" | "martes" | "miercoles" | "jueves" | "viernes" | "sabado" | "domingo";
}