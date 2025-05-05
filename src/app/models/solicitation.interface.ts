import { CopyInterface } from "./copy.interface";
import { TimelineEvent } from "./timelineEvent.interface";
import { User } from "./user.interface";

export interface SolicitationPage {
	content: SolicitationInterface[];
	pageable: {
	  offset: number;
	  pageNumber: number;
	  pageSize: number;
	  paged: boolean;
	  sort: {
		empty: boolean;
		sorted: boolean;
		unsorted: boolean;
	  };
	  unpaged: boolean;
	};
	last: boolean;
	totalPages: number;
	totalElements: number;
	first: boolean;
	number: number;
	numberOfElements: number;
	size: number;
	sort: {
	  empty: boolean;
	  sorted: boolean;
	  unsorted: boolean;
	};
	empty: boolean;
  }

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