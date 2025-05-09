import { CopyInterface } from "./copy.interface";

export interface SolicitationInterface {
	id?: number;
	creationDate?: number; // Data de criação
	term: number; // Prazo
	username?: string; // Nome do usuário
	registration?: string; // Matrícula
	conclusionDate?: number; // Data de conclusão
    archived?: boolean; // Flag de obsolência/arquivado
    totalPageCount: number; // Total de páginas na solicitação
    copies: CopyInterface[]; // Arquivos anexados a solicitação
}