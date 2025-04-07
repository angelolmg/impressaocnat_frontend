import { PrintConfig } from "../printConfig.interface";

export interface CopyDTO {
    file: File; // Arquivo
    fileName: string; // Nome do arquivo
    fileType: string; // Extensão do arquivo
    pageCount: number; // Número de páginas
    printConfig: PrintConfig; // Configurações de impressão
    isPhysicalFile: boolean; // Se o arquivo é físico e não foi anexado digitalmente
    notes: string; // Observações do usuário
}