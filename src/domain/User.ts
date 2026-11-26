//CREAR ENTIDAD DE TIPO DE DOMINIO se hace por medio de interfaces, en este caso se crea una interfaz de usuario

//los mismos campos que tenemos dentro de la BD
export interface User {
    id: number;
    nombre: string;
    correo: string;
    contrasena: string; 
    rol: "usuario" | "admin";
    nivel_salud: "bajo" | "medio" | "alto";
    activo: boolean;
    organizacionId?: number;
}
