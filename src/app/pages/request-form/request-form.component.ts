import {
	AfterViewInit,
	Component,
	inject,
	OnDestroy,
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
import { COPY_MOCK_DATA, CopyInterface } from '../../models/copy.interface';
import {
	actions,
	ActionService,
	ActionType,
	PageType,
} from '../../service/action.service';
import { DialogService } from '../../service/dialog.service';
import { AddCopyComponent } from '../add-copy/add-copy.component';
import { EditCopyComponent } from '../edit-copy/edit-copy.component';

import { PDFDocument } from 'pdf-lib';
import { DialogBoxComponent } from '../../components/dialog-box/dialog-box.component';
import { RequestService } from '../../service/request.service';
import { IconPipe } from '../../pipes/icon.pipe';
import { delay, finalize, Subscription } from 'rxjs';
import { environment } from '../../../environments/environment';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

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
export class RequestFormComponent implements AfterViewInit, OnDestroy {
	actionService = inject(ActionService);
	dialogService = inject(DialogService);
	requestService = inject(RequestService);
	_snackBar = inject(MatSnackBar);

	pageType = PageType.newRequest;

	files: File[] = [];
	copies = new MatTableDataSource<CopyInterface>(COPY_MOCK_DATA);
	allowedActions: ActionType[] = [];
	subscriptions: Subscription[] = [];

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
	uploading = signal(false);

	matcher = new MyErrorStateMatcher();

	ngAfterViewInit(): void {
		if (this.pageType == PageType.newRequest)
			this.allowedActions = actions.allowedActionsforNewRequest;
		else this.allowedActions = actions.allowedActionsforEditRequest;

		this.subscriptions.push(
			this.actionService.deleteCopy.subscribe((copy) => {
				this.removeCopy(copy);
			})
		);

		this.subscriptions.push(
			this.actionService.editCopy.subscribe((copy) => {
				this.editCopyDialog(copy);
			})
		);

		this.refreshTable();
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
			.openDialog(EditCopyComponent, {
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
			.openDialog(AddCopyComponent, {
				title: 'Adicionar Nova Cópia',
				positive_label: 'Adicionar',
			})
			.afterClosed()
			.subscribe((result) => {
				if (result) {
					let file: File = result.file;
					const reader = new FileReader();
					reader.readAsArrayBuffer(result.file);
					reader.onloadend = () => {
						if (reader.result) {
							const pdf = PDFDocument.load(reader.result);
							pdf.then((document: PDFDocument) => {
								this.copies.data.push({
									fileName: file.name,
									fileType: file.type,
									pageCount: document.getPageCount() ?? 0,
									copyCount: result.control.value,
								});

								this.files.push(file);
								this.refreshTable();
							});
						} else {
							console.error('Não foi possível ler arquivo');
						}
					};
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
		if (this.anyCopies() && this.files.length > 0) {

			this.uploading.set(true);

			this.requestService
				.saveRequest(
					this.files,
					this.copies.data,
					this.selectedTermControl.value || 24, // Default 24h de prazo
					this.requestPageCounter()
				)
				.pipe(
					delay(500),
					finalize(() => {
						this.uploading.set(false);
					})
				)
				.subscribe({
					next: (response) => {
						console.log('Resposta: ' + response);
						this.clearCopies();
						this._snackBar.open(
							'Requisição adicionada (ID: ' + response.id + ')',
							'Ok',
							{
								duration: 6000,
							}
						);
					},
					error: (err) => {
						console.error(err);
						this._snackBar.open(err, 'Ok', {
							duration: 6000,
						});
					},
					complete: () => {
						console.info(
							'Procedimento de salvamento de solicitação concluído'
						);
					},
				});
		} else {
			this._snackBar.open(
				'É necessário adicionar pelo menos uma cópia à solicitação',
				'Ok',
				{
					duration: 6000,
				}
			);
		}
	}

	anyCopies() {
		return this.copies.data.length > 0;
	}

	// Unsubscribe para prevenir memory leak
	ngOnDestroy(): void {
		this.subscriptions.forEach((subscription) => {
			subscription.unsubscribe();
		});
	}
}
