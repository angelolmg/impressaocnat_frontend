import { DatePipe } from '@angular/common';
import {
	ChangeDetectionStrategy,
	Component,
	inject,
	OnDestroy,
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
	Subscription,
	switchMap,
	takeUntil,
	tap,
} from 'rxjs';
import { DialogBoxComponent } from '../../components/dialog-box/dialog-box.component';
import { RequestInterface } from '../../models/request.interface';
import { IconPipe } from '../../pipes/icon.pipe';
import {
	actions,
	ActionService,
	ActionType,
	PageType,
} from '../../service/action.service';
import { DialogService } from '../../service/dialog.service';
import { RequestService } from '../../service/request.service';

@Component({
	selector: 'app-list-requests',
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
	templateUrl: './list-requests.component.html',
	styleUrl: './list-requests.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListRequestsComponent implements OnInit, OnDestroy {
	private ngUnsubscribe = new Subject<void>();

	displayedColumns: string[] = [
		'id',
		'registration',
		'username',
		'creationDate',
		'term',
		'conclusionDate',
		'actions',
	];

	allowedActions: ActionType[] = actions.allowedActionsforViewRequests;

	dialogService = inject(DialogService);
	actionService = inject(ActionService);
	requestService = inject(RequestService);
	_snackBar = inject(MatSnackBar);
	router = inject(Router);
	activatedRoute = inject(ActivatedRoute);

	pageType = PageType.viewAllRequests;
	filtering = true;

	requests = new MatTableDataSource<RequestInterface>();
	loadingData = signal(true);

	@ViewChild(MatSort) sort!: MatSort;
	@ViewChild(MatPaginator) paginator!: MatPaginator;

	subscriptions: Subscription[] = [];

	queryForm = new FormGroup({
		concluded: new FormControl<boolean | null>(null),
		startDate: new FormControl<Date | null>(null),
		endDate: new FormControl<Date | null>(null),
		query: new FormControl(),
	});

	ngOnInit() {
		this.actionService.deleteRequest
			.pipe(takeUntil(this.ngUnsubscribe))
			.subscribe((request) => {
				this.deleteRequest(request);
			});

		this.actionService.editRequest
			.pipe(takeUntil(this.ngUnsubscribe))
			.subscribe((request) => {
				this.editRequestRedirect(request);
			});

		this.actionService.viewRequest
			.pipe(takeUntil(this.ngUnsubscribe))
			.subscribe((request) => {
				this.viewRequestRedirect(request);
			});

		this.actionService.toggleRequest
			.pipe(takeUntil(this.ngUnsubscribe))
			.subscribe((request) => {
				this.toggleRequest(request);
			});

		// Inicializar listagem
		// Admins: filtra entre as próprias ou todas as solicitações, a depender da rota '/minhas-solicitacoes' vs '/solicitacoes'
		// Bug: Caso retorne erro, OnInit chamado 2 vezes
		// https://stackoverflow.com/questions/38787795/why-is-ngoninit-called-twice

		this.filtering =
			this.activatedRoute.snapshot.parent != null &&
			this.activatedRoute.snapshot.parent.url[0].path ==
				'minhas-solicitacoes';

		if (this.filtering) this.pageType = PageType.viewMyRequests;

		this.requestService
			.getAllRequests({
				filtering: this.filtering,
				...this.queryForm.value,
			})
			.pipe(
				finalize(() => {
					this.loadingData.set(false);
					return of([]);
				})
			)
			.subscribe({
				next: (requests: RequestInterface[]) => {
					this.requests.data = requests;
					this.requests.sort = this.sort;
					this.requests.paginator = this.paginator;
				},
				error: (err) => {
					console.error(err);
				},
			});

		this.queryForm.valueChanges
			.pipe(
				takeUntil(this.ngUnsubscribe),
				debounceTime(500),
				switchMap((params) => {
					this.loadingData.set(true);
					return this.requestService
						.getAllRequests({
							filtering: this.filtering,
							...params,
						})
						.pipe(finalize(() => this.loadingData.set(false)));
				})
			)
			.subscribe({
				next: (requests: RequestInterface[]) => {
					this.requests.data = requests;
				},
				error: (error) => {
					this._snackBar.open(
						`Erro ao buscar solicitações: ${error}`,
						'Ok'
					);
				},
			});
	}

	generateReport() {
		if (this.requests.data.length > 0) {
			this.dialogService
				.openDialog(DialogBoxComponent, {
					title: `Abrir relatório`,
					message: `Deseja abrir um relatório das (${this.requests.data.length}) solicitações selecionadas?`,
					warning: 'Será aberta uma nova aba',
					positive_label: 'Sim',
					negative_label: 'Não',
				})
				.afterClosed()
				.pipe(
					// Continua somente se o usuário confirmar a ação
					filter((confirmed) => confirmed),
					switchMap(() => {
						this.loadingData.set(true);

						// Abre uma nova janela
						const newWindow = window.open('', '_blank');

						if (!newWindow) {
							this._snackBar.open(
								'Popup bloqueado! Por favor, permita popups para este site.',
								'Ok'
							);
							this.loadingData.set(false);
							return EMPTY;
						}

						// Tela de carregamento padrão
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

						return this.requestService
							.generateReport(this.requests.data)
							.pipe(
								map((reportHtml) => ({ reportHtml, newWindow })) // Passa ambos para o próximo operador
							);
					})
				)
				.subscribe({
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

	getRowCount(): number {
		const isLastPage =
			this.paginator.pageIndex === this.paginator.getNumberOfPages() - 1;
		const itemsInLastPage = this.paginator.length % this.paginator.pageSize;

		return isLastPage && itemsInLastPage !== 0
			? itemsInLastPage
			: this.paginator.pageSize;
	}

	handlePageEvent($event: PageEvent) {
		console.log($event);
	}

	toggleRequest(request: RequestInterface) {
		let requestId = request.id;
		if (!requestId) {
			this._snackBar.open(`Erro: Solicitação não encontrada`, 'Ok');
			return;
		}

		let isClosed = request.conclusionDate;
		this.dialogService
			.openDialog(DialogBoxComponent, {
				title: `${isClosed ? 'Abrir' : 'Fechar'} solicitação`,
				message: `Deseja ${
					isClosed ? 'abrir' : 'fechar'
				} a solicitação Nº ${request.id}?`,
				positive_label: 'Sim',
				negative_label: 'Não',
			})
			.afterClosed()
			.pipe(
				// Continua somente se o usuário confirmar a alteração
				filter((confirmed) => confirmed),
				// Mapeia para a operação de alteração
				switchMap(() => {
					return this.requestService.toogleRequest(requestId).pipe(
						// Após a mudança, atualiza a lista de solicitações
						switchMap((response) => {
							this._snackBar.open(response.message, 'Ok');
							return this.requestService.getAllRequests({
								filtering: this.filtering,
								...this.queryForm.value,
							});
						}),
						tap((requests) => {
							this.requests.data = requests;
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

	deleteRequest(request: RequestInterface): void {
		let requestId = request.id;
		if (!requestId) {
			this._snackBar.open(`Erro: Solicitação não encontrada`, 'Ok');
			return;
		}

		this.dialogService
			.openDialog(DialogBoxComponent, {
				title: 'Excluir solicitação',
				message: `Deseja realmente excluir solicitação Nº ${requestId}?`,
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
					this.requestService.removeRequestById(requestId).pipe(
						// Captura a mensagem de sucesso e emite a próxima operação
						tap((response) => {
							this._snackBar.open(response.message, 'Ok');
						}),
						// Em caso de erro, trata e retorna um observable vazio
						catchError((error) => {
							this._snackBar.open(error.error.message, 'Ok');
							return EMPTY;
						})
					)
				),
				// Após a exclusão, atualiza a lista de solicitações
				switchMap(() =>
					this.requestService.getAllRequests({
						filtering: this.filtering,
						...this.queryForm.value,
					})
				),
				tap((requests) => {
					this.requests.data = requests;
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

	editRequestRedirect(request: RequestInterface) {
		this.router.navigate(['editar', request.id], {
			relativeTo: this.activatedRoute,
		});
	}

	viewRequestRedirect(request: RequestInterface) {
		this.router.navigate(['ver', request.id], {
			relativeTo: this.activatedRoute,
		});
	}

	refreshTable() {
		// Atualizar objeto data source de cópias da tabela
		// Angular Material is weird
		this.requests.data = this.requests.data;
	}

	clearFilters() {
		this.queryForm.reset();
	}

	// Unsubscribe para prevenir memory leak
	ngOnDestroy() {
		this.ngUnsubscribe.next();
		this.ngUnsubscribe.complete();
	}
}
