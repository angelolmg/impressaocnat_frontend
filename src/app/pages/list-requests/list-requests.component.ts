import { DatePipe } from '@angular/common';
import {
	ChangeDetectionStrategy,
	Component,
	inject,
	OnDestroy,
	OnInit,
	signal,
	ViewChild
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import {
	catchError,
	EMPTY,
	filter,
	of,
	Subject,
	Subscription,
	switchMap,
	takeUntil,
	tap
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

	allowedActions: ActionType[] = [];

	dialogService = inject(DialogService);
	actionService = inject(ActionService);
	requestService = inject(RequestService);
	_snackBar = inject(MatSnackBar);
	router = inject(Router);

	pageType = PageType.viewAllRequests;

	requests = new MatTableDataSource<RequestInterface>();
	loadingData = signal(true);

	@ViewChild(MatSort) sort!: MatSort;
	@ViewChild(MatPaginator) paginator!: MatPaginator;

	subscriptions: Subscription[] = [];

	ngOnInit() {
		this.requests.sort = this.sort;
		this.requests.paginator = this.paginator;

		if (this.pageType == PageType.viewAllRequests)
			this.allowedActions = actions.allowedActionsforViewAllRequests;
		else this.allowedActions = actions.allowedActionsforViewMyRequests;

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

		this.actionService.closeRequest
			.pipe(takeUntil(this.ngUnsubscribe))
			.subscribe((request) => {
				this.closeRequest(request);
			});

		this.actionService.openRequest
			.pipe(takeUntil(this.ngUnsubscribe))
			.subscribe((request) => {
				this.openRequest(request);
			});

		this.requestService
			.getAllRequests()
			.pipe(
				catchError((err) => {
					console.error(err);
					this.loadingData.set(false);
					return of([]);
				})
			)
			.subscribe((requests) => {
				this.requests.data = requests;
				this.loadingData.set(false);
			});
	}

	openRequest(request: RequestInterface) {
		console.log('Abrindo solicitação...');
		console.log(request);
	}

	closeRequest(request: RequestInterface) {
		console.log('Fechando solicitação...');
		console.log(request);
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
					this.requestService.deleteRequestById(request.id).pipe(
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
				switchMap(() => this.requestService.getAllRequests()),
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
