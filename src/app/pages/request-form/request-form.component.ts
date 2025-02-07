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
import { AddCopyBoxComponent } from '../../components/add-copy-box/add-copy-box.component';
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
import {
	finalize,
	Observable,
	Subject,
	takeUntil
} from 'rxjs';
import { environment } from '../../../environments/environment';
import { DialogBoxComponent } from '../../components/dialog-box/dialog-box.component';
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

	pageType = '';
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

	ngOnInit(): void {
		// Definir tipo de formulário: edição ou criação
		this.pageType =
			this.route.snapshot.url[0].path == 'editar-solicitacao'
				? PageType.editRequest
				: PageType.newRequest;
		if (this.pageType == PageType.editRequest) {
			this.editRequestId = +this.route.snapshot.paramMap.get('id')!;
			this.pageTitle = this.pageType + ' Nº ' + this.editRequestId;
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
				}
			});
	}

	addCopyDialog() {
		this.dialogService
			.openDialog(AddCopyBoxComponent, {
				title: 'Adicionar Nova Cópia',
				positive_label: 'Adicionar',
			})
			.afterClosed()
			.subscribe((result) => {
				if (result) {
					let file: File = result.file;
					let existingCopyIndex = this.copies.data.findIndex(
						(copy) => copy.fileName === file.name
					);

					const processFile = (index?: number) => {
						const reader = new FileReader();
						reader.readAsArrayBuffer(file);
						reader.onloadend = () => {
							if (reader.result) {
								PDFDocument.load(reader.result).then(
									(document: PDFDocument) => {
										const newCopy = {
											fileName: file.name,
											fileType: file.type,
											pageCount:
												document.getPageCount() ?? 0,
											copyCount: result.control.value,
										};

										if (index !== undefined) {
											this.copies.data[index] = newCopy;
											this.files[index] = file;
										} else {
											this.copies.data.push(newCopy);
											this.files.push(file);
										}

										this.refreshTable();
									}
								);
							} else {
								console.error('Não foi possível ler arquivo');
							}
						};
					};

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
									processFile(existingCopyIndex);
							});
					} else {
						processFile();
					}
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
		// Refresh the data source object
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

	// Unsubscribe para prevenir memory leak
	ngOnDestroy() {
		this.ngUnsubscribe.next();
		this.ngUnsubscribe.complete();
	}
}
