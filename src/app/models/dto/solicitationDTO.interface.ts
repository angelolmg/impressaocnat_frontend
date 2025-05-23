import { CopyDTO } from "./copyDTO.interface";

export interface SolicitationDTO {
	deadline: number; // Prazo
    totalPageCount?: number; // Total de páginas na solicitação
    copies?: CopyDTO[]; // Arquivos anexados a solicitação
}