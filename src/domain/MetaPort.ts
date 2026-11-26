import { Meta } from "./Meta.js";

export interface MetaPort {

    createMeta(meta: Omit<Meta, "id">): Promise<number>;

    updateMeta(id: number, meta: Partial<Meta>): Promise<boolean>;

    deleteMeta(id: number): Promise<boolean>;

    getMetaById(id: number): Promise<Meta | null>;

    getMetasByUsuarioId(usuarioId: number): Promise<Meta[]>;

    getAllMetas(): Promise<Meta[]>;
}
