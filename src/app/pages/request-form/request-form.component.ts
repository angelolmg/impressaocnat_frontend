import { AfterViewInit, Component, inject } from '@angular/core';
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
import { EditCopyComponent } from '../edit-copy/edit-copy.component';
import { AddCopyComponent } from '../add-copy/add-copy.component';

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
		console.log(this.dataSource);
	}
	pageStates: string[] = ['Nova Solicitação', 'Editar Solicitação'];
	pageState: string = this.pageStates[1];

	selectedFile: any = null;
	dataSource = new MatTableDataSource<CopyInterface>(COPY_DATA);
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

	matcher = new MyErrorStateMatcher();

	onFileSelected(event: any): void {
		this.selectedFile = event.target.files[0] ?? null;
		console.log(this.selectedFile);
	}

	callbackHandler(context: string, action: string, element: CopyInterface) {
		switch (context) {
			case 'request-creation':
				return this.removeCopy(element);
		}

		return console.log([context, action, element]);
	}

	removeCopy(copy: CopyInterface) {
		this.dataSource.data = this.dataSource.data.filter(
			(item) => item != copy
		);
	}

	editCopy(copy: CopyInterface) {
		if (this.pageState == 'Editar Solicitação') {
			this.dialogService
				.openDialog({
					title: 'Editando arquivo',
					message: 'Defina o número de cópias',
					data: copy,
					positive_label: 'Confirmar',
					negative_label: 'Cancelar',
				}, EditCopyComponent)
				.afterClosed()
				.subscribe((result) => {
					console.log(result);
				});
		}
	}

	addCopy() {
		this.dialogService
				.openDialog({
					title: 'Adicionar arquivo',
					positive_label: 'Adicionar',
					negative_label: 'Cancelar',
				}, AddCopyComponent)
				.afterClosed()
				.subscribe((result) => {
					console.log(result);
				});
	}
}
