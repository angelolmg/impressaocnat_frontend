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
	FormGroup,
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
import { EditCopyBoxComponent } from '../../components/edit-copy-box/edit-copy-box.component';
import { NewCopyFormData } from '../../models/copy.interface';
import {
	actions,
	ActionService,
	ActionType,
	PageType,
} from '../../service/action.service';
import { DialogService } from '../../service/dialog.service';

import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize, Observable, Subject, takeUntil } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ConfigBoxComponent } from '../../components/config-box/config-box.component';
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
	copies = new MatTableDataSource<NewCopyFormData>();
	allowedActions: ActionType[] = [];

	fileCount = signal(0);
	requestPageCounter = signal(0);
	times: number[] = [48, 24, 12, 4, 2];
	selectedTermControl = new FormControl(environment.DEFAULT_TERM_VALUE);
	displayedColumns: string[] = [
		'fileName',
		'pageCount',
		'copyCount',
		'pageConfig',
		'actions',
	];
	editRequestId: number | undefined;
	uploading = signal(false);
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

	removeCopy(copy: NewCopyFormData) {
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

	editCopyDialog(copy: NewCopyFormData) {
		this.dialogService
			.openDialog(EditCopyBoxComponent, {
				title: 'Editar cópia',
				data: copy,
				positive_label: 'Confirmar',
				negative_label: 'Cancelar',
			})
			.afterClosed()
			.subscribe((result: FormGroup) => {
				const editedParts: Partial<NewCopyFormData> = result.value;

				const copyIndex = this.copies.data.indexOf(copy);

				if (copyIndex >= 0) {
					// Atualize as observações, remova do objeto temporario
					this.copies.data[copyIndex].notes = editedParts.notes;
					delete editedParts.notes;

					// Atualize configurações de impressão
					this.copies.data[copyIndex].printConfig = {
						...this.copies.data[copyIndex].printConfig,
						...editedParts,
					};
				}

				this.refreshTable();
			});
	}

	addCopyDialog() {
		this.dialogService
			.openDialog(NewCopyBoxComponent, { positive_label: 'Finalizar' })
			.afterClosed()
			.subscribe((result: NewCopyFormData | null) => {
				if (!result) return;

				if (!result.isPhysicalFile && !result.file) {
					let msg = 'Erro: Nenhum arquivo anexado.';
					this._snackBar.open(msg, 'Ok');
					console.error(msg);
					return;
				}

				const existingCopyIndex = this.copies.data.findIndex(
					(copy) => copy.fileName === result.file.name
				);

				const addOrUpdateCopy = (index?: number) => {
					if (index !== undefined) {
						this.copies.data[index] = result;
						this.files[index] = result.file;
					} else {
						this.copies.data.push(result);
						this.files.push(result.file);
					}

					this.refreshTable();
				};

				// const processCopy = () => {
				// 	if (existingCopyIndex !== -1) {
				// 		this.dialogService
				// 			.openDialog(DialogBoxComponent, {
				// 				title: 'Sobreescrever cópia',
				// 				message: `Já existe uma cópia com o nome '${this.copies.data[existingCopyIndex].fileName}' nesta solicitação. Deseja sobreescrever?`,
				// 				warning: 'Esta ação é permanente',
				// 				positive_label: 'Sim',
				// 				negative_label: 'Não',
				// 			})
				// 			.afterClosed()
				// 			.subscribe((shouldRewrite: boolean) => {
				// 				if (shouldRewrite)
				// 					addOrUpdateCopy(existingCopyIndex);
				// 			});
				// 	} else {
				// 		addOrUpdateCopy();
				// 	}
				// };

				// processCopy();

				addOrUpdateCopy();
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

	showConfigs(copy: NewCopyFormData) {
		this.dialogService
			.openDialog(ConfigBoxComponent, {
				title: 'Configurações de Impressão',
				data: copy,
				positive_label: 'Ok',
			});
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
			counter += copy.printConfig.sheetsTotal;
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
