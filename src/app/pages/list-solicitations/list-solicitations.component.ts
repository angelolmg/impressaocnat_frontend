import { DatePipe } from '@angular/common';
import {
	ChangeDetectionStrategy,
	Component,
	inject,
	OnDestroy,
	OnInit,
	signal,
	ViewChild,
	WritableSignal,
} from '@angular/core';
import {
	FormControl,
	FormGroup,
	FormsModule,
	ReactiveFormsModule,
} from '@angular/forms';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import {
	MatPaginator,
	MatPaginatorModule,
	PageEvent,
} from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute, Router } from '@angular/router';
import {
	catchError,
	debounceTime,
	EMPTY,
	filter,
	finalize,
	map,
	of,
	Subject,
	switchMap,
	takeUntil,
	tap
} from 'rxjs';
import { DialogBoxComponent } from '../../components/dialog-box/dialog-box.component';
import { SolicitationInterface } from '../../models/solicitation.interface';
import { IconPipe } from '../../pipes/icon.pipe';
import {
	actions,
	ActionService,
	ActionType,
	PageState,
} from '../../service/action.service';
import { DialogService } from '../../service/dialog.service';
import { SolicitationService } from '../../service/solicitation.service';
import { Payload } from '../../models/dto/payload.interface';

@Component({
	selector: 'app-list-solicitations',
	imports: [
		MatTableModule,
		MatSortModule,
		MatPaginatorModule,
		MatIconModule,
		MatInputModule,
		MatDatepickerModule,
		MatNativeDateModule,
		MatFormFieldModule,
		FormsModule,
		MatButtonModule,
		MatTooltipModule,
		DatePipe,
		IconPipe,
		MatBadgeModule,
		MatProgressSpinnerModule,
		ReactiveFormsModule,
		MatSelectModule,
	],
	templateUrl: './list-solicitations.component.html',
	styleUrl: './list-solicitations.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListSolicitationsComponent implements OnInit, OnDestroy {
	// Serviços
	dialogService = inject(DialogService);
	actionService = inject(ActionService);
	solicitationService = inject(SolicitationService);
	_snackBar = inject(MatSnackBar);
	router = inject(Router);
	activatedRoute = inject(ActivatedRoute);

	/** Subject para desinscrever observables e prevenir memory leaks. */
	private ngUnsubscribe = new Subject<void>();

	/** Colunas a serem exibidas na tabela de solicitações. */
	displayedColumns: string[] = [
		'id',
		'registration',
		'username',
		'creationDate',
		'term',
		'conclusionDate',
		'actions',
	];

	/** Ações permitidas para a visualização de solicitações. */
	allowedActions: ActionType[] = actions.allowedActionsforViewSolicitations;

	/** Tipo/estado da página atual. */
	pageState: PageState = PageState.viewAllSolicitations;

	/** Nome deste componente */
	componentName: string = 'list-solicitations';

	/** Indica se a listagem deve mostrar apenas as próprias solicitações. */
	filterForOwnSolicitations: boolean = true;

	/** Fonte de dados para a tabela de requisições. */
	solicitations = new MatTableDataSource<SolicitationInterface>();

	/** Sinal para indicar se os dados estão sendo carregados. */
	loadingData: WritableSignal<boolean> = signal(true);

	// Referências a componentes DOM
	@ViewChild(MatSort) sort!: MatSort;
	@ViewChild(MatPaginator) paginator!: MatPaginator;

	/** Formulário para filtragem e pesquisa de solicitações. */
	queryForm = new FormGroup({
		concluded: new FormControl<boolean | null>(null),
		startDate: new FormControl<Date | null>(null),
		endDate: new FormControl<Date | null>(null),
		query: new FormControl(),
	});

	/**
	 * Método do ciclo de vida chamado na inicialização do componente.
	 *
	 * Inicializa a tabela, aplica filtros e lida com subscriptions.
	 */
	ngOnInit(): void {
		// Observa e lida com diversas ações de solicitações dentro da listagem:
		// Deleção, edição, visualização, abertura e fechamento (toggle)
		this.actionService.deleteSolicitation
			.pipe(takeUntil(this.ngUnsubscribe))
			.subscribe((solicitation) => {
				this.deleteSolicitation(solicitation);
			});

		this.actionService.editSolicitation
			.pipe(takeUntil(this.ngUnsubscribe))
			.subscribe((solicitation) => {
				this.editSolicitationRedirect(solicitation);
			});

		this.actionService.viewSolicitation
			.pipe(takeUntil(this.ngUnsubscribe))
			.subscribe((solicitation) => {
				this.viewSolicitationRedirect(solicitation);
			});

		this.actionService.toggleSolicitationStatus
			.pipe(takeUntil(this.ngUnsubscribe))
			.subscribe((solicitation) => {
				this.toggleSolicitationStatus(solicitation);
			});

		// Inicializa a listagem de requisições.
		// Para administradores: filtra entre as próprias requisições ou todas as requisições, dependendo da rota.
		// '/minhas-solicitacoes' vs '/solicitacoes'.
		// Nota: Existe um bug conhecido que pode causar a chamada dupla do ngOnInit em caso de erro.
		// Referência: https://stackoverflow.com/questions/38787795/why-is-ngoninit-called-twice

		// Determina se a listagem deve filtrar apenas as próprias requisições do usuário.
		this.filterForOwnSolicitations =
			this.activatedRoute.snapshot.parent != null &&
			this.activatedRoute.snapshot.parent.url[0].path ==
				'minhas-solicitacoes';

		// Se a listagem deve filtrar as próprias requisições, atualiza o tipo da página.
		if (this.filterForOwnSolicitations) this.pageState = PageState.viewMySolicitations;

		// Obtém todas as requisições do serviço, aplicando filtros e parâmetros do formulário.
		this.solicitationService
			.getAllSolicitations({
				filtering: this.filterForOwnSolicitations,
				...this.queryForm.value,
			})
			.pipe(
				// Garante que o indicador de carregamento seja desativado após a conclusão da requisição.
				finalize(() => {
					this.loadingData.set(false);
					return of([]);
				})
			)
			.subscribe({
				// Atualiza a tabela de requisições com os dados recebidos.
				next: (solicitations: SolicitationInterface[]) => {
					this.solicitations.data = solicitations;
					this.solicitations.sort = this.sort;
					this.solicitations.paginator = this.paginator;
				},
				error: (err) => {
					console.error(err);
				},
			});

		// Observa mudanças no formulário de pesquisa e aplica filtros.
		this.queryForm.valueChanges
			.pipe(
				takeUntil(this.ngUnsubscribe), // Desinscreve ao destruir o componente.
				debounceTime(500), // Aplica um atraso de 500ms para evitar múltiplas requisições.
				switchMap((params) => {
					// Inicia o indicador de carregamento.
					this.loadingData.set(true);
					// Obtém as requisições filtradas com base nos parâmetros do formulário.
					return this.solicitationService
						.getAllSolicitations({
							filtering: this.filterForOwnSolicitations,
							...params,
						})
						.pipe(finalize(() => this.loadingData.set(false))); // Desativa o indicador de carregamento ao concluir.
				})
			)
			.subscribe({
				// Atualiza a tabela com as requisições filtradas.
				next: (solicitations: SolicitationInterface[]) => {
					this.solicitations.data = solicitations;
				},
				error: (error) => {
					console.error(error);
					this._snackBar.open(
						`Erro ao buscar solicitações. Tente novamente mais tarde.`,
						'Ok'
					);
				},
			});
	}

	/**
	 * Gera um relatório das solicitações exibidas na tabela.
	 *
	 * Abre um diálogo de confirmação para o usuário antes de gerar o relatório.
	 * Se confirmado, abre uma nova aba do navegador com um relatório das solicitações.
	 * Exibe mensagens de erro em um snackbar caso ocorram problemas.
	 */
	generateReport(): void {
		// Verifica se há solicitações na tabela.
		if (this.solicitations.data.length > 0) {
			// Abre um diálogo de confirmação para o usuário.
			this.dialogService
				.openDialog(DialogBoxComponent, {
					title: `Abrir relatório`,
					message: `Deseja abrir um relatório das (${this.solicitations.data.length}) solicitações selecionadas?`,
					warning: 'Será aberta uma nova aba',
					positive_label: 'Sim',
					negative_label: 'Não',
				})
				.afterClosed()
				.pipe(
					// Continua somente se o usuário confirmar a ação
					filter((confirmed) => confirmed),
					// Executa a geração do relatório e abre a nova aba.
					switchMap(() => {
						this.loadingData.set(true);

						// Abre uma nova janela/aba do navegador.
						const newWindow = window.open('', '_blank');

						// Verifica se a nova aba foi aberta com sucesso.
						if (!newWindow) {
							this._snackBar.open(
								'Popup bloqueado! Por favor, permita popups para este site.',
								'Ok'
							);
							this.loadingData.set(false);
							return EMPTY;
						}

						// Exibe uma tela de carregamento na nova aba.
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

						// Chama o serviço para gerar o relatório HTML das solicitações.
						return this.solicitationService
							.generateReport(this.solicitations.data)
							.pipe(
								// Passa o relatório HTML e a nova aba para o próximo operador.
								map((reportHtml) => ({ reportHtml, newWindow }))
							);
					})
				)
				.subscribe({
					// Escreve o relatório HTML na nova aba.
					next: ({ reportHtml, newWindow }) => {
						// Verifica se a nova aba ainda está aberta antes de escrever o relatório
						if (newWindow && !newWindow.closed) {
							newWindow.document.open();
							newWindow.document.write(reportHtml);
							newWindow.document.close();
						} else {
							this._snackBar.open(
								'Não foi possível abrir o relatório. Verifique as configurações de popups do navegador.',
								'Ok'
							);
						}
					},
					error: (err) => {
						console.error(err);
						this._snackBar.open(err, 'Ok');
					},
					complete: () => {
						this.loadingData.set(false);
					},
				});
		} else {
			this._snackBar.open(
				`Nenhuma solicitação encontrada. Ajuste os filtros de pesquisa.`,
				'Ok'
			);
		}
	}

	handlePageEvent($event: PageEvent): void {
		console.log($event);
	}

	/**
	 * Alterna o status de uma solicitação (aberta/fechada).
	 *
	 * Abre um diálogo de confirmação para o usuário antes de alterar o status da solicitação.
	 * Se confirmado, chama o serviço para alterar o status da solicitação e atualiza a tabela.
	 * Exibe mensagens de erro em um snackbar caso ocorram problemas.
	 *
	 * @param {SolicitationInterface} solicitation A solicitação a ser alternada.
	 */
	toggleSolicitationStatus(solicitation: SolicitationInterface): void {
		let solicitationId = solicitation.id;

		// Verifica se o ID da solicitação é válido.
		if (!solicitationId) {
			this._snackBar.open(`Erro: Solicitação não encontrada`, 'Ok');
			return;
		}

		// Verifica se a solicitação está fechada.
		let isClosed = solicitation.conclusionDate;

		// Abre um diálogo de confirmação para o usuário.
		this.dialogService
			.openDialog(DialogBoxComponent, {
				title: `${isClosed ? 'Abrir' : 'Fechar'} solicitação`,
				message: `Deseja ${
					isClosed ? 'abrir' : 'fechar'
				} a solicitação Nº ${solicitation.id}?`,
				positive_label: 'Sim',
				negative_label: 'Não',
			})
			.afterClosed()
			.pipe(
				// Continua somente se o usuário confirmar a alteração
				filter((confirmed) => confirmed),
				// Mapeia para a operação de alteração
				switchMap(() => {
					return this.solicitationService
						.toggleSolicitationStatus(solicitationId)
						.pipe(
								// After the status change, fetch the updated list of solicitations
								switchMap((response: string) => {
									this._snackBar.open(response, 'Ok');
									return this.solicitationService.getAllSolicitations({
										filtering: this.filterForOwnSolicitations,
										...this.queryForm.value,
									});
								}),
								// Update the table with the updated solicitations.
								tap((solicitations) => {
									this.solicitations.data = solicitations;
								}),
								catchError((error) => {
									console.log(error);
									this._snackBar.open(error.error.message, 'Ok');
									return EMPTY;
								})
							);
				})
			)
			.subscribe();
	}

	/**
	 * Exclui uma solicitação específica.
	 *
	 * Abre um diálogo de confirmação para o usuário antes de excluir a solicitação.
	 * Se confirmado, chama o serviço para excluir a solicitação e atualiza a tabela.
	 * Exibe mensagens de sucesso ou erro em um snackbar.
	 *
	 * @param {SolicitationInterface} solicitation A solicitação a ser removida.
	 */
	deleteSolicitation(solicitation: SolicitationInterface): void {
		let solicitationId = solicitation.id;

		// Verifica se o ID da solicitação é válido.
		if (!solicitationId) {
			this._snackBar.open(`Erro: Solicitação não encontrada`, 'Ok');
			return;
		}

		// Abre um diálogo de confirmação para o usuário.
		this.dialogService
			.openDialog(DialogBoxComponent, {
				title: 'Excluir solicitação',
				message: `Deseja realmente excluir solicitação Nº ${solicitationId}?`,
				warning: 'Esta ação é permanente',
				positive_label: 'Sim',
				negative_label: 'Não',
			})
			.afterClosed()
			.pipe(
				// Continua somente se o usuário confirmar a exclusão
				filter((confirmed) => confirmed),
				// Mapeia para a operação de exclusão
				switchMap(() =>
					this.solicitationService.removeSolicitationById(solicitationId).pipe(
						// Exibe um snackbar com a mensagem de sucesso.
						tap((response: string) => {
							this._snackBar.open(response, 'Ok');
						}),
						catchError((error) => {
							this._snackBar.open(error.error.message, 'Ok');
							return EMPTY;
						})
					)
				),
				// Após a exclusão, busca lista atualizada de solicitações
				switchMap(() =>
					this.solicitationService.getAllSolicitations({
						filtering: this.filterForOwnSolicitations,
						...this.queryForm.value,
					})
				),
				// Atualiza a tabela com as solicitações atualizadas.
				tap((solicitations) => {
					this.solicitations.data = solicitations;
				}),
				catchError((error) => {
					this._snackBar.open(
						`Erro ao atualizar solicitações: ${error.message}`,
						'Ok'
					);
					return EMPTY;
				})
			)
			.subscribe();
	}

	/**
	 * Redireciona para a página de edição de uma solicitação específica.
	 *
	 * Navega para a rota '/editar/:id', onde ':id' é o ID da solicitação.
	 * A navegação é relativa à rota ativa atual.
	 *
	 * @param {SolicitationInterface} solicitation A solicitação a ser editada.
	 */
	editSolicitationRedirect(solicitation: SolicitationInterface): void {
		this.router.navigate(['editar', solicitation.id], {
			relativeTo: this.activatedRoute,
		});
	}

	/**
	 * Redireciona para a página de visualização de uma solicitação específica.
	 *
	 * Navega para a rota '/ver/:id', onde ':id' é o ID da solicitação.
	 * A navegação é relativa à rota ativa atual.
	 *
	 * @param {SolicitationInterface} solicitation A solicitação a ser visualizada.
	 */
	viewSolicitationRedirect(solicitation: SolicitationInterface): void {
		this.router.navigate(['ver', solicitation.id], {
			relativeTo: this.activatedRoute,
		});
	}

	/**
	 * Limpa os filtros de pesquisa da tabela.
	 *
	 * Reseta o formulário 'queryForm' para seus valores iniciais, removendo todos os filtros aplicados.
	 */
	clearFilters(): void {
		this.queryForm.reset();
	}

	/**
	 * Método do ciclo de vida chamado quando o componente é destruído.
	 *
	 * Desinscreve observables para prevenir memory leaks.
	 */
	ngOnDestroy(): void {
		this.ngUnsubscribe.next();
		this.ngUnsubscribe.complete();
	}
}
