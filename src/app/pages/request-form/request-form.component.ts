import { AfterViewInit, Component, inject, signal } from '@angular/core';
import {
	FormControl,
	FormGroupDirective,
	FormsModule,
	NgForm,
	ReactiveFormsModule,
	Validators,
} from '@angular/forms';
import { MatButton, MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { ErrorStateMatcher } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { COPY_DATA, CopyInterface } from '../../models/copy.interface';
import { ActionService } from '../../service/action.service';
import { DialogService } from '../../service/dialog.service';
import { AddCopyComponent } from '../add-copy/add-copy.component';
import { EditCopyComponent } from '../edit-copy/edit-copy.component';

import { PDFDocument } from 'pdf-lib';

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
	],
	templateUrl: './request-form.component.html',
	styleUrl: './request-form.component.scss',
})
export class RequestFormComponent implements AfterViewInit {
	ngAfterViewInit(): void {
		// console.log(this.copies);
		this.refreshTable();
	}
	pageStates: string[] = ['Nova Solicitação', 'Editar Solicitação'];
	pageState: string = this.pageStates[0];

	files: any[] = [];
	fileCount = signal(0);
	requestPageCounter = signal(0);

	matcher = new MyErrorStateMatcher();
	copies = new MatTableDataSource<CopyInterface>(COPY_DATA);
	actionService = inject(ActionService);
	dialogService = inject(DialogService);

	times: number[] = [48, 24, 12, 4, 2];

	allowedActions: string[] = ['Editar', 'Excluir'];

	displayedColumns: string[] = [
		'file_name',
		'page_count',
		'copy_count',
		'actions',
	];

	copyNumFormControl = new FormControl(10, [
		Validators.required,
		Validators.min(1),
	]);

	callbackHandler(context: string, action: string, element: CopyInterface) {
		switch (context) {
			case 'request-creation':
				return this.removeCopy(element);
		}
		return console.log([context, action, element]);
	}

	removeCopy(copy: CopyInterface) {
		const copyIndex = this.copies.data.indexOf(copy);

		if (copyIndex >= 0) {
			this.copies.data.splice(copyIndex, 1);
			this.files.splice(copyIndex, 1);

			this.refreshTable();
		}
	}

	editCopyDialog(copy: CopyInterface) {
		if (this.pageState == 'Editar Solicitação') {
			this.dialogService
				.openDialog(
					{
						title: 'Editando arquivo',
						message: 'Defina o número de cópias',
						data: copy,
						positive_label: 'Confirmar',
						negative_label: 'Cancelar',
					},
					EditCopyComponent
				)
				.afterClosed()
				.subscribe((result) => {
					console.log(result);
				});
		}
	}

	addCopyDialog() {
		this.dialogService
			.openDialog(
				{
					title: 'Adicionar arquivo',
					positive_label: 'Adicionar',
					negative_label: 'Cancelar',
				},
				AddCopyComponent
			)
			.afterClosed()
			.subscribe((result) => {
				console.log(result);
				const reader = new FileReader();
				reader.readAsArrayBuffer(result.file);
				reader.onloadend = () => {
					if (reader.result) {
						const pdf = PDFDocument.load(reader.result);
						pdf.then((document: PDFDocument) => {
							this.copies.data.push({
								file_name: result.file.name,
								file_type: result.file.type,
								page_count: document.getPageCount() ?? 999,
								copy_count: result.control.value,
							});

							this.files.push(result.file);

							this.refreshTable();
						});
					} else {
						console.log('Não foi possível ler arquivo');
					}
				};
			});
	}

	clearCopies() {
		this.copies.data = [];
		this.files = [];

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
			counter += copy.page_count * copy.copy_count;
		});

		this.requestPageCounter.set(counter);
	}
}
