import {
	ChangeDetectionStrategy,
	Component,
	inject,
	OnInit,
	signal,
	ViewChild,
} from '@angular/core';
import {
	FormControl,
	FormGroup,
	FormsModule,
	ReactiveFormsModule,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatStepperModule } from '@angular/material/stepper';
import {
	actions,
	ActionService,
	ActionType,
	DEFAULT_USER_PROFILE,
} from '../../service/action.service';
import { DialogService } from '../../service/dialog.service';
import { CopyInterface } from '../../models/copy.interface';
import { PageState } from '../../service/action.service';

import { HttpErrorResponse } from '@angular/common/http';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { ActivatedRoute, Router } from '@angular/router';
import {
	concat,
	debounceTime,
	filter,
	finalize,
	map,
	Subject,
	switchMap,
	takeUntil,
	tap,
	throwError,
} from 'rxjs';
import { ConfigBoxComponent } from '../../components/config-box/config-box.component';
import { DialogBoxComponent } from '../../components/dialog-box/dialog-box.component';
import { FormErrorStateMatcher } from '../../configs/validators.config';
import {
	DialogDataResponse,
	FileDownloadResponse,
} from '../../models/dialogData.interface';
import { SolicitationInterface } from '../../models/solicitation.interface';
import { IconPipe } from '../../pipes/icon.pipe';
import { SolicitationService } from '../../service/solicitation.service';
import { SplitPipe } from '../../pipes/split.pipe';
import { DatePipe } from '@angular/common';
import { UserService } from '../../service/user.service';
import { User } from '../../models/user.interface';

/**
 * Componente para visualização de uma solicitação específica.
 */
@Component({
	selector: 'app-view-solicitation',
	imports: [
		MatSortModule,
		MatPaginatorModule,
		FormsModule,
		MatFormFieldModule,
		MatInputModule,
		ReactiveFormsModule,
		MatTableModule,
		MatIconModule,
		MatTooltipModule,
		MatButtonModule,
		MatSelectModule,
		MatChipsModule,
		IconPipe,
		DatePipe,
		SplitPipe,
		MatProgressSpinnerModule,
		MatStepperModule,
	],
	templateUrl: './view-solicitation.component.html',
	styleUrl: './view-solicitation.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ViewSolicitationComponent implements OnInit {
	/** Subject para desinscrição de observables no ngOnDestroy. */
	private ngUnsubscribe = new Subject<void>();

	// Referência para componentes
	@ViewChild(MatSort) sort!: MatSort;
	@ViewChild(MatPaginator) paginator!: MatPaginator;

	// Serviços
	route = inject(ActivatedRoute);
	actionService = inject(ActionService);
	dialogService = inject(DialogService);
	userService = inject(UserService);
	solicitationService = inject(SolicitationService);
	_snackBar = inject(MatSnackBar);
	router = inject(Router);

	/** Informações padrão do usuário */
	defaultUserProfile = DEFAULT_USER_PROFILE;

	/** Objeto da solicitação atual. */
	mySolicitation = signal<SolicitationInterface | undefined>(undefined);

	/** ID da solicitação atual. */
	solicitationId?: number;

	/** Lista de arquivos anexados. */
	files: any[] = [];

	/** Sinal que armazena o número de arquivos. */
	fileCount = signal(0);

	/** Sinal que armazena o número total de páginas da solicitação. */
	solicitationPageCounter = signal(0);

	/** Sinal que indica se os dados estão sendo carregados. */
	loadingData = signal(false);

	/** Tipo de ação para detalhes. */
	configs = ActionType.CONFIGURACOES;

	/** Instância do validador de estado de erro personalizado. */
	matcher = new FormErrorStateMatcher();

	/** Fonte de dados para a tabela de cópias. */
	copies = new MatTableDataSource<CopyInterface>();

	/** Lista de ações permitidas para a página de visualização de solicitações. */
	allowedActions = actions.allowedActionsforViewSolicitation;

	/** Estado da página atual. */
	pageState = PageState.viewSolicitation;

	/** Rota da página anterior. */
	previousPage: string = '';

	/** Nº de caracteres na caixa de comentários. */
	characterCount: number = 0;

	/** Nº máximo de caracteres permitidos na caixa de comentários. */
	maxlength: number = 300;

	/** Colunas a serem exibidas na tabela de cópias. */
	displayedColumns: string[] = [
		'fileName',
		'pageCount',
		'copyCount',
		'actions',
	];

	/** Formulário de pesquisa. */
	queryForm = new FormGroup({
		query: new FormControl(),
	});

	userSignal = signal<User | undefined>(undefined);

	/**
	 * Inicializa o componente.
	 *
	 * Obtém o ID da solicitação da rota, inscreve-se em eventos de exclusão e download de cópias,
	 * busca os detalhes da solicitação e configura a tabela de cópias.
	 * Também configura o filtro de pesquisa de cópias.
	 */
	ngOnInit() {
		// Obtém o ID da solicitação da rota.
		this.solicitationId = +this.route.snapshot.paramMap.get('id')!;

		// Inscreve-se nos evento de exclusão e download de cópia.
		this.actionService.deleteCopy
			.pipe(takeUntil(this.ngUnsubscribe))
			.subscribe((copy) => {
				this.removeCopy(copy);
			});
		this.actionService.downloadCopy
			.pipe(takeUntil(this.ngUnsubscribe))
			.subscribe((copy: CopyInterface) => {
				this.downloadFileAndOpenInNewWindow(copy);
			});
		this.actionService.showCopyConfigs
			.pipe(takeUntil(this.ngUnsubscribe))
			.subscribe((copy: CopyInterface) => {
				this.showConfigs(copy);
			});

		this.userService.userUpdate$
			.pipe(takeUntil(this.ngUnsubscribe))
			.subscribe((data) => {
				// Atualiza as informações do usuário com os dados recebidos.
				this.userSignal.set(data);
			});

		// Busca a solicicitação no view init e carrega os dados da tabela de cópias
		this.loadingData.set(true);
		this.solicitationService
			.getSolicitationById(this.solicitationId)
			.pipe(finalize(() => this.loadingData.set(false)))
			.subscribe({
				next: (solicitation: SolicitationInterface) => {
					this.mySolicitation.set(solicitation);
					this.copies.sort = this.sort;
					this.copies.paginator = this.paginator;
					this.updateTable(solicitation.copies);
				},
				error: (error) => {
					console.error(error);
					// Falha ao buscar solicitação, redirecione o usuário
					this.router.navigate(['']);
				},
			});

		// Atualiza lista de cópias passando filtro de nome de arquivo
		this.queryForm.valueChanges
			.pipe(
				takeUntil(this.ngUnsubscribe),
				debounceTime(500),
				map((params) => params.query?.trim() || ''), // Remover espaços em branco e tornar em string
				filter((query) => query.length == 0 || query.length >= 3), // Continuar apenas se a query tiver 0 ou 3+ caracteres
				switchMap((query) => {
					if (!this.solicitationId)
						return throwError(() => {
							return new Error(
								'Nenhum ID de solicitação definido.'
							);
						});
					this.loadingData.set(true);
					return this.solicitationService
						.getCopiesBySolicitationId(this.solicitationId, query)
						.pipe(finalize(() => this.loadingData.set(false)));
				})
			)
			.subscribe({
				next: (copies: CopyInterface[]) => (this.copies.data = copies),
				error: (error) => {
					console.error('Erro ao buscar solicitações:', error);
				},
			});
	}

	updateCharacterCount() {
		const textarea = document.querySelector('textarea');
		if (textarea) {
			this.characterCount = textarea.value.length;
		}
	}

	sendComment(comment: string) {
		if (comment.trim()) {
			this.loadingData.set(true);
			this.solicitationService
				.addCommentToSolicitation(this.solicitationId!, {
					message: comment,
				})
				.pipe(
					tap((response: string) => {
						this._snackBar.open(response, 'Ok');
						this.clearCommentInput();
					}),
					switchMap(() =>
						this.solicitationService
							.getSolicitationById(this.solicitationId!)
							.pipe(finalize(() => this.loadingData.set(false)))
					),
					tap((solicitation: SolicitationInterface) => {
						this.mySolicitation.set(solicitation);
					})
				)
				.subscribe({
					error: (error) => {
						console.error(
							'Erro ao enviar comentário e/ou buscar solicitação:',
							error
						);
					},
				});
		} else {
			this._snackBar.open('Comentário não pode ser vazio.', 'Ok');
		}
	}

	private clearCommentInput() {
		const textarea = document.querySelector('textarea');
		if (textarea) {
			textarea.value = '';
			this.characterCount = 0;
		}
	}

	goToEditSolicitation() {
		if (!this.solicitationId) return;
		// Navega para a página de edição da solicitação com o ID da solicitação atual.
		var editRoute = 'solicitacoes/editar/' + this.solicitationId;
		this.router.navigate([editRoute]);
	}

	/**
	 * Remove uma cópia específica da solicitação.
	 *
	 * Abre um diálogo de confirmação antes de remover a cópia.
	 * Se a cópia for a última da solicitação, a solicitação inteira será removida.
	 * Caso contrário, a cópia é removida e a tabela é atualizada.
	 *
	 * @param {CopyInterface} copy A cópia a ser removida.
	 * @returns {void}
	 */
	removeCopy(copy: CopyInterface): void {
		// Verifica se a cópia é a última da solicitação.
		const isLastCopy = this.copies.data.length === 1;
		// Define a mensagem de aviso caso a cópia seja a última.
		const lastCopyMessage = isLastCopy
			? 'Esta é a única cópia e a solicitação também será removida. '
			: '';

		// Abre um diálogo de confirmação para remover a cópia.
		this.dialogService
			.openDialog(DialogBoxComponent, {
				title: 'Excluir cópia',
				message:
					"Deseja realmente excluir cópia de '" +
					copy.fileName +
					"'?",
				warning: lastCopyMessage + 'Esta ação é permanente',
				positive_label: 'Sim',
				negative_label: 'Não',
			})
			.afterClosed()
			.subscribe((dialog: DialogDataResponse) => {
				let solicitationId = this.mySolicitation()?.id;

				// Se o usuário confirmar a remoção e o ID da solicitação existir.
				if (dialog.confirmation && solicitationId) {
					if (isLastCopy) {
						// Se a cópia for a última, remove a solicitação inteira.
						this.solicitationService
							.removeSolicitationById(
								solicitationId,
								dialog.sendNotification
							)
							.subscribe((response: string) => {
								this._snackBar.open(response, 'Ok');
								this.router.navigate([
									this.actionService.getLastPageState(true) ||
										'nova-solicitacao',
								]);
							});
					} else {
						// Remove a cópia da solicitação e atualiza a tabela.
						let removeCopy =
							this.solicitationService.removeCopyById(
								copy.id!,
								this.mySolicitation()!
							);
						let getUpdatedSolicitation =
							this.solicitationService.getSolicitationById(
								solicitationId
							);

						// Combina os observables para garantir que a tabela seja atualizada após a remoção da cópia.
						concat(removeCopy, getUpdatedSolicitation).subscribe(
							(solicitation: SolicitationInterface) => {
								this.mySolicitation.set(solicitation);
								this.updateTable(solicitation.copies);
								this._snackBar.open(
									'Cópia removida com sucesso.',
									'Ok'
								);
							}
						);
					}
				}
			});
	}

	/**
	 * Faz o download de um arquivo e o abre em uma nova janela.
	 *
	 * Verifica se o arquivo está disponível em disco e se o ID da solicitação existe.
	 * Abre uma nova janela, exibe uma mensagem de carregamento, faz o download do arquivo,
	 * e exibe o arquivo na nova janela. Trata erros e bloqueios de pop-up.
	 *
	 * @param {CopyInterface} copy A cópia do arquivo a ser baixado.
	 * @returns {void}
	 */
	downloadFileAndOpenInNewWindow(copy: CopyInterface): void {
		// Verifica se o arquivo está disponível em disco e se o ID da solicitação existe.
		if (copy.fileInDisk && this.solicitationId) {
			this.loadingData.set(true);

			// Abre uma nova janela em branco.
			const newWindow = window.open('', '_blank');

			// Verifica se a nova janela foi aberta com sucesso.
			if (!newWindow) {
				this.loadingData.set(false);
				this._snackBar.open(
					'Popup boqueado! Por favor permita popups para este site.',
					'Ok'
				);
				return;
			}

			// Exibe uma mensagem de carregamento na nova janela.
			newWindow.document.write(`
			<!DOCTYPE html>
			<html>
				<head>
					<title>Por favor aguarde...</title>
				</head>
				<body>
					<h1 style="margin: 1rem">Carregando seu arquivo...</h1>
				</body>
			</html>
		  `);

			// Faz o download do arquivo usando o serviço de solicitação.
			this.solicitationService
				.downloadFile(this.solicitationId, copy.fileName)
				.pipe(
					// Define o status de carregamento como falso e fecha a nova janela após a conclusão.
					finalize(() => {
						this.loadingData.set(false);
						newWindow.document.close();
						console.info('Download finalizado.');
					})
				)
				.subscribe({
					// Exibe o arquivo na nova janela após o download bem-sucedido.
					next: (response: FileDownloadResponse) => {
						if (newWindow) {
							const url = window.URL.createObjectURL(
								response.data
							);
							newWindow.document.open();
							newWindow.document.write(`
							<html>
								<head>
									<title>${copy.fileName}</title>
									<style>
										body, html, iframe { margin: 0; width: 100%; height: 100%; border: none; }
									</style>
								</head>
								<body>
									<iframe src="${url}"></iframe>
								</body>
							</html>
							`);
							newWindow.document.close();
						}
					},

					error: (error: HttpErrorResponse) => {
						if (newWindow) newWindow.close();

						this._snackBar.open(
							'Ocorreu um erro ao baixar o arquivo',
							'Ok'
						);
						console.error(error);
						return throwError(() => error);
					},
				});
		} else {
			this._snackBar.open('Arquivo não disponível.', 'Ok');
		}
	}

	/**
	 * Limpa a lista de cópias e os arquivos anexados.
	 *
	 * Remove todas as cópias da fonte de dados e limpa a lista de arquivos.
	 * Em seguida, atualiza a tabela para refletir as alterações.
	 *
	 * @returns {void}
	 */
	clearCopies(): void {
		this.copies.data = [];
		this.files = [];

		this.updateTable(this.copies.data);
	}

	/**
	 * Atualiza a tabela de cópias, o contador de arquivos e o contador de páginas da solicitação.
	 *
	 * Atualiza a fonte de dados da tabela de cópias com a lista fornecida ou uma lista vazia.
	 * Atualiza o contador de arquivos com o número de cópias na lista.
	 * Calcula e atualiza o número total de páginas da solicitação com base nas cópias.
	 *
	 * @param {CopyInterface[]} [copies] A lista de cópias para atualizar a tabela. Se não fornecida, usa uma lista vazia.
	 * @returns {void}
	 */
	updateTable(copies?: CopyInterface[]): void {
		// Atualizar objeto data source de cópias da tabela
		this.copies.data = copies || [];

		// Atualiza o contador de arquivos com o número de cópias na lista.
		this.fileCount.set(this.copies.data.length);

		// Calcula o número total de páginas da solicitação.
		var counter = 0;
		this.copies.data.forEach((copy) => {
			counter += copy.printConfig.sheetsTotal;
		});

		this.solicitationPageCounter.set(counter);
	}

	/**
	 * Exibe as configurações de impressão de uma cópia em um diálogo.
	 *
	 * Abre um diálogo contendo as configurações de impressão da cópia especificada.
	 *
	 * @param {CopyInterface} copy A cópia cujas configurações de impressão serão exibidas.
	 * @returns {void}
	 */
	showConfigs(copy: CopyInterface): void {
		this.dialogService.openDialog(ConfigBoxComponent, {
			title: 'Configurações de Impressão',
			data: copy,
			positive_label: 'Ok',
		});
	}

	/**
	 * Limpa os filtros de pesquisa.
	 *
	 * Reseta o formulário de pesquisa, removendo todos os filtros aplicados.
	 *
	 * @returns {void}
	 */
	clearFilters(): void {
		this.queryForm.reset();
	}

	/**
	 * Navega para a rota especificada.
	 *
	 * @param {string} route A rota para a qual navegar. Se `undefined`, a navegação não ocorre.
	 * @returns {void}
	 */
	navigateTo(route?: string): void {
		if (route) this.router.navigate([route]);
	}

	/**
	 * Método do ciclo de vida chamado quando o componente é destruído.
	 *
	 * Desinscreve observables para prevenir memory leaks.
	 */
	ngOnDestroy() {
		this.ngUnsubscribe.next();
		this.ngUnsubscribe.complete();
	}
}
