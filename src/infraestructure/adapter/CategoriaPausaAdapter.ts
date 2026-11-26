import { Repository } from "typeorm";
import { CategoriaPausa as CategoriaDomain } from "../../domain/CategoriaPausa.js";
import { CategoriaPausa as CategoriaEntity } from "../entities/CategoriaPausa.js";
import { CategoriaPausaPort } from "../../domain/CategoriaPausaPort.js";
import { AppDataSource } from "../config/data-base.js";

export class CategoriaPausaAdapter implements CategoriaPausaPort {

    private categoriaRepository: Repository<CategoriaEntity>;

    constructor() {
        this.categoriaRepository = AppDataSource.getRepository(CategoriaEntity);
    }

    // ENTITY -> DOMAIN
    private toDomain(categoria: CategoriaEntity): CategoriaDomain {
        const domain: CategoriaDomain = {
            id: categoria.id,
            nombre: categoria.nombre,
            activo: categoria.activo
        };
        if (categoria.descripcion !== null) {
            domain.descripcion = categoria.descripcion;
        }
        return domain;
    }

    // DOMAIN -> ENTITY
    private toEntity(categoria: Omit<CategoriaDomain, "id">): CategoriaEntity {
        const entity = new CategoriaEntity();
        entity.nombre = categoria.nombre;
        entity.descripcion = categoria.descripcion ?? null;
        entity.activo = categoria.activo;
        return entity;
    }

    async createCategoria(categoria: Omit<CategoriaDomain, "id">): Promise<number> {
        const saved = await this.categoriaRepository.save(this.toEntity(categoria));
        return saved.id;
    }

    async updateCategoria(id: number, categoria: Partial<CategoriaDomain>): Promise<boolean> {
        const existing = await this.categoriaRepository.findOne({ where: { id } });
        if (!existing) return false;

        Object.assign(existing, {
            nombre: categoria.nombre ?? existing.nombre,
            descripcion: categoria.descripcion ?? existing.descripcion,
            activo: categoria.activo ?? existing.activo,
        });

        await this.categoriaRepository.save(existing);
        return true;
    }

    async deleteCategoria(id: number): Promise<boolean> {
        const existing = await this.categoriaRepository.findOne({ where: { id } });
        if (!existing) return false;

        // soft delete
        existing.activo = false;
        await this.categoriaRepository.save(existing);
        return true;
    }

    async getCategoriaById(id: number): Promise<CategoriaDomain | null> {
        const categoria = await this.categoriaRepository.findOne({ where: { id } });
        return categoria ? this.toDomain(categoria) : null;
    }

    async getCategoriaByNombre(nombre: string): Promise<CategoriaDomain | null> {
        const categoria = await this.categoriaRepository
            .createQueryBuilder("c")
            .where("LOWER(c.nombre) = LOWER(:nombre)", { nombre })
            .getOne();
        return categoria ? this.toDomain(categoria) : null;
    }

    async getAllCategorias(): Promise<CategoriaDomain[]> {
        const categorias = await this.categoriaRepository.find({ order: { id: "ASC" } });
        return categorias.map(c => this.toDomain(c));
    }

    async getActiveCategorias(): Promise<CategoriaDomain[]> {
        const categorias = await this.categoriaRepository.find({ where: { activo: true }, order: { id: "ASC" } });
        return categorias.map(c => this.toDomain(c));
    }
}
