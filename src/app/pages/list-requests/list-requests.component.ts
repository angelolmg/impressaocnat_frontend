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
import { MatSelectModule } from '@angular/material/select';

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
		MatSelectModule
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
			this.activatedRoute.snapshot.url[0].path == 'minhas-solicitacoes';

		if (this.filtering) this.pageType = PageType.viewMyRequests;

		this.requestService
			.getAllRequests({
				filtering: this.filtering,
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
					this.loadingData.set(false);
				},
				error: (err) => {
					console.error(err);
				},
			});

		this.queryForm.valueChanges
			.pipe(
				takeUntil(this.ngUnsubscribe),
				debounceTime(500),
				switchMap((params) =>
					this.requestService.getAllRequests({
						filtering: this.filtering,
						concluded: this.queryForm.get('concluded')?.value,
						...params,
					})
				)
			)
			.subscribe({
				next: (requests: RequestInterface[]) =>
					(this.requests.data = requests),
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
					// Continua somente se o usuário confirmar a alteração
					filter((confirmed) => confirmed),
					// Mapeia para a operação de alteração
					switchMap(() => {
						return this.requestService.generateReport(
							this.requests.data
						);
					})
				)
				.subscribe({
					next: (reportHtml: string) => {
						// Open the report in a new window
						const newWindow = window.open();
						if (newWindow) {
							newWindow.document.write(reportHtml); // Write the HTML content to the new window
							newWindow.document.close(); // Close the document for rendering
						}
					},
					error: (err) => {
						console.error(err);
						this._snackBar.open(err, 'Ok');
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
		let hasConclusion = request.conclusionDate;

		this.dialogService
			.openDialog(DialogBoxComponent, {
				title: `${hasConclusion ? 'Abrir' : 'Fechar'} solicitação`,
				message: `Deseja ${
					hasConclusion ? 'abrir' : 'fechar'
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
					return this.requestService.toogleRequest(request.id).pipe(
						// Após a mudança, atualiza a lista de solicitações
						switchMap((response) => {
							this._snackBar.open(response.message, 'Ok');
							return this.requestService.getAllRequests({
								filtering: this.filtering,
								concluded:
									this.queryForm.get('concluded')?.value,
							});
						}),
						tap((requests) => {
							this.requests.data = requests;
						})
					);
				})
			)
			.subscribe();
	}

	deleteRequest(request: RequestInterface): void {
		this.dialogService
			.openDialog(DialogBoxComponent, {
				title: 'Excluir solicitação',
				message: `Deseja realmente excluir solicitação Nº ${request.id}?`,
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
					this.requestService.removeRequestById(request.id).pipe(
						// Captura a mensagem de sucesso e emite a próxima operação
						tap((response) => {
							this._snackBar.open(response.message, 'Ok');
						}),
						// Em caso de erro, trata e retorna um observable vazio
						catchError((error) => {
							this._snackBar.open(
								`Erro ao excluir solicitação: ${error.message}`,
								'Ok'
							);
							return EMPTY;
						})
					)
				),
				// Após a exclusão, atualiza a lista de solicitações
				switchMap(() =>
					this.requestService.getAllRequests({
						filtering: this.filtering,
						concluded: this.queryForm.get('concluded')?.value,
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
		console.log('Editando solicitação...');
		console.log(request);
		this.router.navigate(['/editar-solicitacao', request.id]);
	}

	viewRequestRedirect(request: RequestInterface) {
		console.log('Ver solicitação...');
		console.log(request);
		this.router.navigate(['/ver-solicitacao', request.id]);
	}

	refreshTable() {
		// Refresh the data source object
		// Angular Material is weird
		this.requests.data = this.requests.data;
	}

	// Unsubscribe para prevenir memory leak
	ngOnDestroy() {
		this.ngUnsubscribe.next();
		this.ngUnsubscribe.complete();
	}
}
