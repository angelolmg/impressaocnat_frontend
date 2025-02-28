export interface CopyInterface {
	id?: number;
	fileName: string; // Nome do arquivo
	fileType: string; // Extensão do arquivo
	pageCount: number; // Número de páginas
	copyCount: number; // Número de cópias
	fileInDisk?: boolean; // Se o arquivo esta salvo no backend
	isPhysicalFile?: boolean; // Se o arquivo é físico e não foi anexado digitalmente
	requestId?: number; // ID da solicitação associada
}

export interface PrintConfig {
	copyCount: number; // Número de cópias
	pages: 'Todas' | 'Personalizado';
	pageIntervals?: string;
	pagesPerSheet: 1 | 2 | 4;
	layout: 'Retrato' | 'Paisagem';
	frontAndBack: boolean;
	sheetsTotal: number; // Calculado pelo nº de paginas no documento e configurações de impressão
}

export interface NewCopyFormData {
	id?: number;
	file: File; // Arquivo
	fileName: string; // Nome do arquivo
	fileType: string; // Extensão do arquivo
	pageCount: number; // Número de páginas
	printConfig: PrintConfig; // Configurações de impressão
	fileInDisk?: boolean; // Se o arquivo esta salvo no backend
	isPhysicalFile: boolean; // Se o arquivo é físico e não foi anexado digitalmente
	requestId?: number; // ID da solicitação associada
	notes?: string; // Observações do usuário
}


export const COPY_MOCK_DATA: CopyInterface[] = [
	{
		id: 1,
		fileName: 'Relatório Mensal Janeiro',
		fileType: 'pdf',
		pageCount: 50,
		copyCount: 10,
	},
	{
		id: 2,
		fileName: 'Ata Reunião Diretoria 2023-02',
		fileType: 'docx',
		pageCount: 5,
		copyCount: 5,
	},
	{
		id: 3,
		fileName: 'Proposta Comercial Cliente ABC',
		fileType: 'pdf',
		pageCount: 12,
		copyCount: 20,
	},
	{
		id: 4,
		fileName: 'Contrato Fornecedor XYZ',
		fileType: 'pdf',
		pageCount: 25,
		copyCount: 2,
	},
	{
		id: 5,
		fileName: 'Manual Usuário Software Beta',
		fileType: 'pdf',
		pageCount: 150,
		copyCount: 1,
	},
	{
		id: 6,
		fileName: 'Plano Marketing Digital 2024',
		fileType: 'pptx',
		pageCount: 30,
		copyCount: 8,
	},
	{
		id: 7,
		fileName: 'Orçamento Obra Reforma Escritório',
		fileType: 'xlsx',
		pageCount: 2,
		copyCount: 15,
	},
	{
		id: 8,
		fileName: 'Cronograma Implementação Novo Sistema',
		fileType: 'xlsx',
		pageCount: 1,
		copyCount: 30,
	},
	{
		id: 9,
		fileName: 'Pesquisa Satisfação Clientes 2023',
		fileType: 'pdf',
		pageCount: 8,
		copyCount: 7,
	},
	{
		id: 10,
		fileName: 'Formulário Cadastro Novo Funcionário',
		fileType: 'docx',
		pageCount: 3,
		copyCount: 25,
	},
	{
		id: 11,
		fileName: 'Apresentação Resultados Trimestrais',
		fileType: 'pptx',
		pageCount: 40,
		copyCount: 5,
	},
	{
		id: 12,
		fileName: 'Termo Adesão Programa Benefícios',
		fileType: 'pdf',
		pageCount: 1,
		copyCount: 100,
	},
	{
		id: 13,
		fileName: 'Declaração Imposto Renda 2022',
		fileType: 'pdf',
		pageCount: 4,
		copyCount: 3,
	},
	{
		id: 14,
		fileName: 'Histórico Paciente João Silva',
		fileType: 'pdf',
		pageCount: 18,
		copyCount: 1,
	},
	{
		id: 15,
		fileName: 'Laudo Técnico Avaliação Imóvel',
		fileType: 'pdf',
		pageCount: 10,
		copyCount: 6,
	},
	{
		id: 16,
		fileName: 'Receituário Médico Maria Oliveira',
		fileType: 'pdf',
		pageCount: 1,
		copyCount: 2,
	},
	{
		id: 17,
		fileName: 'Certidão Nascimento Filho Pedro',
		fileType: 'pdf',
		pageCount: 1,
		copyCount: 4,
	},
	{
		id: 18,
		fileName: 'Cópia RG Ana Santos',
		fileType: 'pdf',
		pageCount: 1,
		copyCount: 7,
	},
	{
		id: 19,
		fileName: 'Comprovante Endereço José Ferreira',
		fileType: 'pdf',
		pageCount: 1,
		copyCount: 9,
	},
	{
		id: 20,
		fileName: 'Extrato Bancário Conta Corrente',
		fileType: 'pdf',
		pageCount: 5,
		copyCount: 12,
	},
];
