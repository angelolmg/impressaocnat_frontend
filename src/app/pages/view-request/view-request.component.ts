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
	FormGroupDirective,
	FormsModule,
	NgForm,
	ReactiveFormsModule,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { ErrorStateMatcher } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
	actions,
	ActionService,
	ActionType,
} from '../../service/action.service';
import { DialogService } from '../../service/dialog.service';
import { CopyInterface } from './../../models/copy.interface';
import { PageType } from './../../service/action.service';

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
	throwError,
} from 'rxjs';
import { ConfigBoxComponent } from '../../components/config-box/config-box.component';
import { DialogBoxComponent } from '../../components/dialog-box/dialog-box.component';
import { RequestInterface } from '../../models/request.interface';
import { IconPipe } from '../../pipes/icon.pipe';
import {
	FileDownloadResponse,
	RequestService,
} from '../../service/request.service';

/** Error when invalid control is dirty, touched, or submitted. */
export class MyErrorStateMatcher implements ErrorStateMatcher {
	isErrorState(
		control: FormControl | null,
		form: FormGroupDirective | NgForm | null
	): boolean {
		const isSubmitted = form && form.submitted;
		return !!(
			control &&
			control.invalid &&
			(control.dirty || control.touched || isSubmitted)
		);
	}
}

@Component({
	selector: 'app-view-request',
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
		MatProgressSpinnerModule,
	],
	templateUrl: './view-request.component.html',
	styleUrl: './view-request.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ViewRequestComponent implements OnInit {
	private ngUnsubscribe = new Subject<void>();

	@ViewChild(MatSort) sort!: MatSort;
	@ViewChild(MatPaginator) paginator!: MatPaginator;
	requestId?: number;
	myRequest?: RequestInterface;

	files: any[] = [];
	fileCount = signal(0);
	requestPageCounter = signal(0);
	loadingData = signal(false);
	detalhes = ActionType.DETALHES;

	matcher = new MyErrorStateMatcher();
	copies = new MatTableDataSource<CopyInterface>();
	route = inject(ActivatedRoute);
	actionService = inject(ActionService);
	dialogService = inject(DialogService);
	requestService = inject(RequestService);
	_snackBar = inject(MatSnackBar);
	router = inject(Router);

	allowedActions = actions.allowedActionsforViewRequest;
	pageType = PageType.viewRequest;
	previousPage: string | undefined = '';

	displayedColumns: string[] = [
		'fileName',
		'pageCount',
		'copyCount',
		'pageConfig',
		'actions',
	];

	queryForm = new FormGroup({
		query: new FormControl(),
	});

	ngOnInit() {
		this.requestId = +this.route.snapshot.paramMap.get('id')!;

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

		// Busca a solicicitação no view init e carrega os dados da tabela de cópias
		this.loadingData.set(true);
		this.requestService
			.getRequestById(this.requestId)
			.pipe(finalize(() => this.loadingData.set(false)))
			.subscribe({
				next: (request: RequestInterface) => {
					this.myRequest = request;
					this.copies.sort = this.sort;
					this.copies.paginator = this.paginator;
					this.updateTable(request.copies);
				},
				error: (error) => {
					this._snackBar.open(
						`Erro ao buscar solicitação: ${error}`,
						'Ok'
					);
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
					this.loadingData.set(true);
					return this.requestService
						.getCopiesByRequestId(this.requestId, query)
						.pipe(finalize(() => this.loadingData.set(false)));
				})
			)
			.subscribe({
				next: (copies: CopyInterface[]) => (this.copies.data = copies),
				error: (error) => {
					this._snackBar.open(
						`Erro ao buscar solicitações: ${error}`,
						'Ok'
					);
				},
			});
	}

	removeCopy(copy: CopyInterface) {
		let isLastCopy = this.copies.data.length == 1;
		let lastCopyMessage = isLastCopy
			? 'Esta é a única cópia e a solicitação também será excluída. '
			: '';

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
			.subscribe((shouldRemove: boolean) => {
				let requestId = this.myRequest?.id;
				if (shouldRemove && requestId) {
					if (isLastCopy) {
						this.requestService
							.removeRequestById(requestId)
							.subscribe((response) => {
								this._snackBar.open(response.message, 'Ok');
								this.router.navigate([
									this.actionService.getLastPageState(true) ||
										'nova-solicitacao',
								]);
							});
					} else {
						let removeCopy = this.requestService.removeCopyById(
							copy.id!,
							this.myRequest!
						);
						let getUpdatedRequest =
							this.requestService.getRequestById(requestId);

						concat(removeCopy, getUpdatedRequest).subscribe(
							(request: RequestInterface) => {
								this.myRequest = request;
								this.updateTable(request.copies);
								this._snackBar.open(
									'Cópia excluída com sucesso.',
									'Ok'
								);
							}
						);
					}
				}
			});
	}

	downloadFileAndOpenInNewWindow(copy: CopyInterface): void {
		if (copy.fileInDisk && this.requestId) {
			this.loadingData.set(true);
			const newWindow = window.open('', '_blank');

			if (!newWindow) {
				this.loadingData.set(false);
				this._snackBar.open(
					'Popup boqueado! Por favor permita popups para este site.',
					'Ok'
				);
				return;
			}

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

			this.requestService
				.downloadFile(this.requestId, copy.fileName)
				.pipe(
					finalize(() => {
						this.loadingData.set(false);
						newWindow.document.close();
						console.log('Download finalizado.');
					})
				)
				.subscribe({
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

	clearCopies() {
		this.copies.data = [];
		this.files = [];

		this.updateTable(this.copies.data);
	}

	updateTable(copies?: CopyInterface[]) {
		// Atualizar objeto data source de cópias da tabela
		// Angular Material is weird
		this.copies.data = copies || [];

		this.fileCount.set(this.copies.data.length);

		// Refresh total page counter of the request
		var counter = 0;
		this.copies.data.forEach((copy) => {
			counter += copy.printConfig.sheetsTotal;
		});

		this.requestPageCounter.set(counter);
	}

	showConfigs(copy: CopyInterface) {
		this.dialogService.openDialog(ConfigBoxComponent, {
			title: 'Configurações de Impressão',
			data: copy,
			positive_label: 'Ok',
		});
	}

	clearFilters() {
		this.queryForm.reset();
	}

	navigateTo(route: string | null) {
		if (route) this.router.navigate([route]);
	}

	getLastPageState(asRoute?: boolean) {
		return this.actionService.getLastPageState(asRoute);
	}

	// Unsubscribe para prevenir memory leak
	ngOnDestroy() {
		this.ngUnsubscribe.next();
		this.ngUnsubscribe.complete();
	}
}
