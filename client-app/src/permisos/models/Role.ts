 export interface Role {
    key: string; // Identificador único del rol
    name: string;
    description: string;
    scopes: string[]; // Lista de scope keys
}