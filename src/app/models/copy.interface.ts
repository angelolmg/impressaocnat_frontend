import { PrintConfig } from "./printConfig.interface";

export interface CopyInterface {
	id?: number;
	file: File; // Arquivo
	fileName: string; // Nome do arquivo
	fileType: string; // Extensão do arquivo
	pageCount: number; // Número de páginas
	printConfig: PrintConfig; // Configurações de impressão
	fileInDisk?: boolean; // Se o arquivo esta salvo no backend
	isPhysicalFile: boolean; // Se o arquivo é físico e não foi anexado digitalmente
	solicitationId?: number; // ID da solicitação associada
	notes: string; // Observações do usuário
}