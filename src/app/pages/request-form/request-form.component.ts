import {
	AfterViewInit,
	Component,
	inject,
	OnDestroy,
	OnInit,
	signal,
} from '@angular/core';
import {
	FormControl,
	FormGroupDirective,
	FormsModule,
	NgForm,
	ReactiveFormsModule,
} from '@angular/forms';
import { MatButton, MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { ErrorStateMatcher } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
	CopyFormData
} from '../../components/add-copy-box/add-copy-box.component';
import { EditCopyBoxComponent } from '../../components/edit-copy-box/edit-copy-box.component';
import { CopyInterface } from '../../models/copy.interface';
import {
	actions,
	ActionService,
	ActionType,
	PageType,
} from '../../service/action.service';
import { DialogService } from '../../service/dialog.service';

import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, Router } from '@angular/router';
import { PDFDocument } from 'pdf-lib';
import { finalize, Observable, Subject, takeUntil } from 'rxjs';
import { environment } from '../../../environments/environment';
import { DialogBoxComponent } from '../../components/dialog-box/dialog-box.component';
import { NewCopyBoxComponent } from '../../components/new-copy-box/new-copy-box.component';
import { IconPipe } from '../../pipes/icon.pipe';
import { RequestService } from '../../service/request.service';

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
	selector: 'app-request-form',
	imports: [
		MatButton,
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
	templateUrl: './request-form.component.html',
	styleUrl: './request-form.component.scss',
})
export class RequestFormComponent implements AfterViewInit, OnDestroy, OnInit {
	private ngUnsubscribe = new Subject<void>();

	actionService = inject(ActionService);
	dialogService = inject(DialogService);
	requestService = inject(RequestService);
	_snackBar = inject(MatSnackBar);
	route = inject(ActivatedRoute);
	router = inject(Router);

	pageType = PageType.newRequest;
	pageTitle: string = PageType.newRequest;
	files: File[] = [];
	copies = new MatTableDataSource<CopyInterface>();
	allowedActions: ActionType[] = [];

	fileCount = signal(0);
	requestPageCounter = signal(0);
	times: number[] = [48, 24, 12, 4, 2];
	selectedTermControl = new FormControl(environment.DEFAULT_TERM_VALUE);
	displayedColumns: string[] = [
		'fileName',
		'pageCount',
		'copyCount',
		'actions',
	];
	editRequestId: number | undefined;
	uploading = signal(false);
	matcher = new MyErrorStateMatcher();
	loadingData = signal(false);

	public get editRequest(): PageType {
		return PageType.editRequest;
	}

	ngOnInit(): void {
		// Definir tipo de formulário: edição ou criação
		let url = this.route.snapshot.url[0];
		this.pageType =
			url && url.path == 'editar'
				? PageType.editRequest
				: PageType.newRequest;
		if (this.pageType == PageType.editRequest) {
			this.editRequestId = +this.route.snapshot.paramMap.get('id')!;
			this.pageTitle =
				this.pageType +
				' Nº ' +
				this.editRequestId.toString().padStart(6, '0');
			this.loadingData.set(true);
			this.requestService
				.getRequestById(this.editRequestId)
				.pipe(
					finalize(() => {
						this.loadingData.set(false);
					})
				)
				.subscribe((request) => {
					this.copies.data = request.copies!;
					this.selectedTermControl.setValue(request.term / (60 * 60));
					this.refreshTable();
				});
		}
	}

	ngAfterViewInit(): void {
		// Definir ações permitidas nos formulários, a depender do tipo de página
		if (this.pageType == PageType.newRequest)
			this.allowedActions = actions.allowedActionsforNewRequest;
		else this.allowedActions = actions.allowedActionsforEditRequest;

		// Observar eventos de deleção e edição

		this.actionService.deleteCopy
			.pipe(takeUntil(this.ngUnsubscribe))
			.subscribe((copy) => {
				this.removeCopy(copy);
			});

		this.actionService.editCopy
			.pipe(takeUntil(this.ngUnsubscribe))
			.subscribe((copy) => {
				this.editCopyDialog(copy);
			});
	}

	removeCopy(copy: CopyInterface) {
		this.dialogService
			.openDialog(DialogBoxComponent, {
				title: 'Excluir cópia',
				message:
					"Deseja realmente excluir cópia de '" +
					copy.fileName +
					"'?",
				warning: 'Esta ação é permanente',
				positive_label: 'Sim',
				negative_label: 'Não',
			})
			.afterClosed()
			.subscribe((shouldRemove: boolean) => {
				if (!shouldRemove) return;
				const copyIndex = this.copies.data.indexOf(copy);

				if (copyIndex >= 0) {
					this.copies.data.splice(copyIndex, 1);
					this.files.splice(copyIndex, 1);

					this.refreshTable();
				}
			});
	}

	editCopyDialog(copy: CopyInterface) {
		this.dialogService
			.openDialog(EditCopyBoxComponent, {
				title: 'Editar cópia',
				message: 'Defina o número de cópias',
				data: copy,
				positive_label: 'Confirmar',
				negative_label: 'Cancelar',
			})
			.afterClosed()
			.subscribe((result: FormControl) => {
				if (result && !result.errors) {
					const copyIndex = this.copies.data.indexOf(copy);

					if (copyIndex >= 0)
						this.copies.data[copyIndex].copyCount = result.value;

					this.refreshTable();
				} else {
					this._snackBar.open(
						'Erro: Campos inválidos no formulário.'
					);
				}
			});
	}

	addCopyDialog() {
		this.dialogService
			.openDialog(NewCopyBoxComponent, { positive_label: 'Adicionar' })
			.afterClosed()
			.subscribe((result: CopyFormData) => {
				if (!result) return;

				if (
					!result.copyNumControl().valid ||
					!result.pageNumControl().valid
				) {
					let msg = 'Erro: Campos inválidos no formulário.';
					this._snackBar.open(msg, 'Ok');
					console.error(msg);
					return;
				}

				if (!result.isPhysical() && !result.file()) {
					let msg = 'Erro: Nenhum arquivo anexado.';
					this._snackBar.open(msg, 'Ok');
					console.error(msg);
					return;
				}

				// Se é arquivo físico, inicializar um arquivo vazio com nome aleatório único
				// Caso contrário, manter o nome usual
				let now = new Date().getTime().toString();
				const file: File = result.isPhysical()
					? new File([], now)
					: result.file();

				const fileName = result.isPhysical()
					? 'Arquivo Físico'
					: file.name;
				const fileType = result.isPhysical()
					? 'Arquivo Físico'
					: file.type;
				const copyCount = result.copyNumControl().value;
				const isPhysical = result.isPhysical();

				const existingCopyIndex = this.copies.data.findIndex(
					(copy) => copy.fileName === file.name
				);

				const getPageCount = (file: File): Observable<number> => {
					return new Observable<number>((observer) => {
						const reader = new FileReader();
						reader.readAsArrayBuffer(file);
						reader.onloadend = () => {
							if (reader.result) {
								PDFDocument.load(reader.result)
									.then((document) => {
										observer.next(
											document.getPageCount() ?? 0
										);
										observer.complete();
									})
									.catch((error) => {
										console.error(
											'Erro ao carregar PDF:',
											error
										);
										observer.error(error);
									});
							} else {
								console.error('Não foi possível ler arquivo');
								observer.error('Não foi possível ler arquivo');
							}
						};
					});
				};

				const addOrUpdateCopy = (pageCount: number, index?: number) => {
					const newCopy: CopyInterface = {
						fileName,
						fileType,
						pageCount: isPhysical
							? result.pageNumControl().value
							: pageCount,
						copyCount,
						isPhysicalFile: isPhysical,
					};

					if (index !== undefined) {
						this.copies.data[index] = newCopy;
						this.files[index] = file;
					} else {
						this.copies.data.push(newCopy);
						this.files.push(file);
					}

					this.refreshTable();
				};

				const processCopy = (pageCount: number) => {
					if (existingCopyIndex !== -1) {
						this.dialogService
							.openDialog(DialogBoxComponent, {
								title: 'Sobreescrever cópia',
								message: `Já existe uma cópia com o nome '${this.copies.data[existingCopyIndex].fileName}' nesta solicitação. Deseja sobreescrever?`,
								warning: 'Esta ação é permanente',
								positive_label: 'Sim',
								negative_label: 'Não',
							})
							.afterClosed()
							.subscribe((shouldRewrite: boolean) => {
								if (shouldRewrite)
									addOrUpdateCopy(
										pageCount,
										existingCopyIndex
									);
							});
					} else {
						addOrUpdateCopy(pageCount);
					}
				};

				if (!isPhysical) {
					getPageCount(file).subscribe({
						next: (pageCount) => processCopy(pageCount),
						error: (error) => {
							console.error(
								'Erro ao obter número de páginas:',
								error
							);
							this._snackBar.open(
								'Erro ao obter número de páginas do PDF',
								'Ok'
							);
						},
					});
				} else {
					// Processar objeto de arquivo físico
					processCopy(0);
				}
			});
	}

	clearCopiesDialog() {
		if (this.anyCopies()) {
			this.dialogService
				.openDialog(DialogBoxComponent, {
					title: 'Limpar Cópias',
					message: `Deseja realmente excluir todas as [${this.copies.data.length}] cópias anexadas?`,
					warning: 'Esta ação é permanente',
					positive_label: 'Sim',
					negative_label: 'Não',
				})
				.afterClosed()
				.subscribe((result: boolean) => {
					if (result) this.clearCopies();
				});
		}
	}

	clearCopies() {
		this.copies.data = [];
		this.files = [];
		this.selectedTermControl.setValue(environment.DEFAULT_TERM_VALUE);

		this.refreshTable();
	}

	refreshTable() {
		// Atualizar objeto data source de cópias da tabela
		// Angular Material is weird
		this.copies.data = this.copies.data;

		this.fileCount.set(this.copies.data.length);

		// Refresh total page counter of the request
		var counter = 0;
		this.copies.data.forEach((copy) => {
			counter += copy.pageCount * copy.copyCount;
		});

		this.requestPageCounter.set(counter);
	}

	submitRequest() {
		let sub: Observable<any> = new Observable<any>();

		switch (this.pageType) {
			case PageType.newRequest:
				if (this.anyCopies() && this.files.length > 0) {
					this.uploading.set(true);

					sub = this.requestService.saveRequest(
						this.files,
						this.copies.data,
						this.selectedTermControl.value || 24, // Default 24h de prazo
						this.requestPageCounter()
					);
				} else {
					this._snackBar.open(
						'É necessário adicionar pelo menos uma cópia à solicitação',
						'Ok'
					);
				}
				break;
			case PageType.editRequest:
				this.uploading.set(true);

				sub = this.requestService.editRequest(
					this.editRequestId!,
					this.files,
					this.copies.data,
					this.selectedTermControl.value || 24,
					this.requestPageCounter()
				);
				break;
		}

		sub.pipe(
			finalize(() => {
				this.uploading.set(false);
			})
		).subscribe({
			next: (response) => {
				this._snackBar.open(
					'Cadastro bem sucedido (ID: ' +
						response.id.toString().padStart(6, '0') +
						')',
					'Ok'
				);
				this.clearCopies();
				this.router.navigate(['minhas-solicitacoes']);
			},
			error: (err) => {
				console.error(err);
				this._snackBar.open(err, 'Ok');
			},
		});
	}

	anyCopies() {
		return this.copies.data.length > 0;
	}

	getLastPageState(asRoute?: boolean): string | null {
		return this.actionService.getLastPageState(asRoute);
	}

	navigateTo(route: string | null) {
		if (route) this.router.navigate([route]);
	}

	// Unsubscribe para prevenir memory leak
	ngOnDestroy() {
		this.ngUnsubscribe.next();
		this.ngUnsubscribe.complete();
	}
}
