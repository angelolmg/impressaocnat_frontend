import { CopyInterface } from "./copy.interface";
import { TimelineEvent } from "./timelineEvent.interface";
import { User } from "./user.interface";

export interface SolicitationInterface {
	id?: number;
	deadline: number; // Prazo
	creationDate?: number; // Data de criação
	conclusionDate?: number; // Data de conclusão
    archived?: boolean; // Flag de obsolência/arquivado
	user: User; // Usuário que fez a solicitação
    totalPageCount: number; // Total de páginas na solicitação
    copies: CopyInterface[]; // Arquivos anexados a solicitação
	timeline: TimelineEvent[]; // Linha do tempo da solicitação
}