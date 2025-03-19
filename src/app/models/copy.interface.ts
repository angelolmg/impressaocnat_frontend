export interface PrintConfig {
	copyCount: number; // Número de cópias
	pages: 'Todas' | 'Personalizado'; // Tipo de intervalo de páginas
	pageIntervals?: string; // Intervalo de páginas se pages = 'Personalizado'
	pagesPerSheet: 1 | 2 | 4; // Páginas por folha
	layout: 'Retrato' | 'Paisagem'; // Orientação da página
	frontAndBack: boolean; // Se a impressão é frente e verso
	sheetsTotal: number; // Calculado pelo nº de paginas no documento e configurações de impressão
}

export interface CopyInterface {
	id?: number;
	file: File; // Arquivo
	fileName: string; // Nome do arquivo
	fileType: string; // Extensão do arquivo
	pageCount: number; // Número de páginas
	printConfig: PrintConfig; // Configurações de impressão
	fileInDisk?: boolean; // Se o arquivo esta salvo no backend
	isPhysicalFile: boolean; // Se o arquivo é físico e não foi anexado digitalmente
	requestId?: number; // ID da solicitação associada
	notes: string; // Observações do usuário
}