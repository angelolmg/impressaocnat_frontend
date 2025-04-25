import { Role } from "./enums/role.enum";

export interface User {
    commonName: string; // Nome usual
    registrationNumber: string; // Matrícula
    email: string;
    phoneNumbers: string; // Telefones
    sector: string; // Setor suap
    photoUrl: string; // url Foto
    role?: Role; // Papel
}