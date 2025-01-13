import {
	AfterViewInit,
	Component,
	inject,
	signal,
	ViewChild,
} from '@angular/core';
import {
	FormControl,
	FormGroupDirective,
	FormsModule,
	NgForm,
	ReactiveFormsModule,
	Validators,
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
import { COPY_DATA, CopyInterface } from '../../models/copy.interface';
import { ActionService } from '../../service/action.service';
import { DialogService } from '../../service/dialog.service';
import { EditCopyComponent } from '../edit-copy/edit-copy.component';

import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';

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
	],
	templateUrl: './view-request.component.html',
	styleUrl: './view-request.component.scss',
})
export class ViewRequestComponent implements AfterViewInit {
	@ViewChild(MatSort) sort!: MatSort;
	@ViewChild(MatPaginator) paginator!: MatPaginator;

	ngAfterViewInit() {
		this.copies.sort = this.sort;
		this.copies.paginator = this.paginator;
		this.refreshTable();
	}

	requestNumber: number = 1111;

	files: any[] = [];
	fileCount = signal(0);
	requestPageCounter = signal(0);

	matcher = new MyErrorStateMatcher();
	copies = new MatTableDataSource<CopyInterface>(COPY_DATA);
	actionService = inject(ActionService);
	dialogService = inject(DialogService);

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

	downloadFile(element: any) {
		console.log(element);
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
