export interface PrintConfig {
	copyCount: number; // Número de cópias
	pages: 'Todas' | 'Personalizado'; // Tipo de intervalo de páginas
	pageIntervals?: string; // Intervalo de páginas se pages = 'Personalizado'
	pagesPerSheet: 1 | 2 | 4; // Páginas por folha
	layout: 'Retrato' | 'Paisagem'; // Orientação da página
	frontAndBack: boolean; // Se a impressão é frente e verso
	sheetsTotal: number; // Calculado pelo nº de paginas no documento e configurações de impressão
}