import { MatPaginatorIntl } from "@angular/material/paginator";

/**
 * Função para personalizar as labels e a lógica do paginador do Material Design.
 *
 * Esta função cria uma instância de `MatPaginatorIntl` e personaliza as labels
 * exibidas no paginador, bem como a lógica para gerar a label do intervalo de itens.
 *
 * @returns {MatPaginatorIntl} Uma instância de `MatPaginatorIntl` com as personalizações aplicadas.
 */
export function CustomPaginator(): MatPaginatorIntl {
    // Cria uma nova instância de MatPaginatorIntl.
    const customPaginatorIntl = new MatPaginatorIntl();

    // Define as labels personalizadas para o paginador.
    customPaginatorIntl.itemsPerPageLabel = 'Itens por página:';
    customPaginatorIntl.firstPageLabel = 'Primeira página';
    customPaginatorIntl.previousPageLabel = 'Voltar';
    customPaginatorIntl.nextPageLabel = 'Próxima';
    customPaginatorIntl.lastPageLabel = 'Última página';

    /**
     * Função para gerar a label do intervalo de itens exibidos no paginador.
     *
     * @param {number} page O número da página atual (começando em 0).
     * @param {number} pageSize O número de itens por página.
     * @param {number} length O número total de itens.
     * @returns {string} A label do intervalo de itens.
     */
    customPaginatorIntl.getRangeLabel = (page: number, pageSize: number, length: number) => {
        // Se não houver itens ou o tamanho da página for 0, retorna "0 de [comprimento]".
        if (length === 0 || pageSize === 0) {
            return '0 de ' + length;
        }

        // Garante que o comprimento seja sempre um valor não negativo.
        length = Math.max(length, 0);
        // Calcula o índice inicial do intervalo.
        const startIndex = page * pageSize;
        // Calcula o índice final do intervalo.
        // Se o índice inicial exceder o comprimento da lista, o índice final também será calculado,
        // mas não será fixado no final da lista.
        const endIndex = startIndex < length ?
            Math.min(startIndex + pageSize, length) :
            startIndex + pageSize;
        // Retorna a label do intervalo no formato "[início + 1] - [fim] de [comprimento]".
        return startIndex + 1 + ' - ' + endIndex + ' de ' + length;
    };

    // Retorna a instância personalizada de MatPaginatorIntl.
    return customPaginatorIntl;
}