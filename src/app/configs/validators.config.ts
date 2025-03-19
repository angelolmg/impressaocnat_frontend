import { AbstractControl, FormControl, FormGroupDirective, NgForm, ValidationErrors } from "@angular/forms";
import { ErrorStateMatcher } from "@angular/material/core";

/**
 * Validador personalizado para o formato de intervalo de páginas.
 *
 * Este validador verifica se o valor do controle corresponde ao formato esperado
 * para intervalos de páginas (números únicos ou intervalos separados por hífen,
 * separados por vírgulas). Ele também verifica se os números das páginas estão
 * dentro dos limites válidos (1 até o número total de páginas).
 *
 * @param {number} totalPages O número total de páginas do documento.
 * @returns {(control: AbstractControl) => ValidationErrors | null} Uma função validadora que retorna erros de validação ou null.
 */
export function pageRangeValidator(
    totalPages: number
): (control: AbstractControl) => ValidationErrors | null {
    return (control: AbstractControl): ValidationErrors | null => {
        // Expressão regular para o formato de intervalos de páginas:
        // números únicos ou intervalos (ex: "1-5, 8, 11-13").
        // Permite espaços em branco ao redor de vírgulas e hífens.
        const regex = /^(\d+(-\d+)?)(,\s*\d+(-\d+)?)*$/;

        // Verifica primeiro o formato usando a expressão regular.
        if (!regex.test(control.value)) {
            // Retorna um erro de validação se o formato for inválido.
            return { invalidFormat: true };
        }

        // Verifica a validade dos intervalos e os limites.
        const ranges = control.value.split(',');
        for (const range of ranges) {
            const parts = range.trim().split('-');

            if (parts.length === 2) {
                // Intervalo como "1-5".
                const start = parseInt(parts[0], 10);
                const end = parseInt(parts[1], 10);

                // Verifica se o número inicial é maior ou igual ao número final.
                if (start >= end) {
                    // Retorna um erro de validação se o intervalo for inválido.
                    return { invalidRange: true };
                }

                // Verifica se os números das páginas estão dentro dos limites válidos.
                if (start < 1 || end > totalPages) {
                    // Retorna um erro de validação se os números estiverem fora dos limites.
                    return { outOfBounds: true };
                }
            } else {
                // Página única como "8".
                const page = parseInt(parts[0], 10);

                // Verifica se o número da página está dentro dos limites válidos.
                if (page < 1 || page > totalPages) {
                    // Retorna um erro de validação se o número estiver fora dos limites.
                    return { outOfBounds: true };
                }
            }
        }

        // Retorna null se todas as validações passarem.
        return null;
    };
}

/**
 * Verifica se um controle de formulário deve exibir erros.
 *
 * Esta classe verifica se um controle de formulário é inválido e se o formulário foi submetido ou o controle foi interagido.
 * Se ambas as condições forem verdadeiras, o controle exibirá erros.
 * 
 * @param {FormControl | null} control O controle de formulário a ser verificado.
 * @param {FormGroupDirective | NgForm | null} form O formulário pai do controle.
 * @returns {boolean} Retorna true se o controle deve exibir erros, false caso contrário.
 */
export class FormErrorStateMatcher implements ErrorStateMatcher {
    isErrorState(
        control: FormControl | null,
        form: FormGroupDirective | NgForm | null
    ): boolean {
        // Verifica se o formulário foi submetido.
        const isSubmitted = form && form.submitted;
        // Retorna true se o controle for inválido e se o controle foi interagido ou o formulário foi submetido.
        return !!(
            control &&
            control.invalid &&
            (control.dirty || control.touched || isSubmitted)
        );
    }
}