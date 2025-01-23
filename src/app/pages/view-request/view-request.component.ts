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
	ReactiveFormsModule
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
import { CopyInterface } from '../../models/copy.interface';
import { actions, ActionService } from '../../service/action.service';
import { DialogService } from '../../service/dialog.service';
import { EditCopyComponent } from '../edit-copy/edit-copy.component';
import { PageType } from './../../service/action.service';

import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
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
	],
	templateUrl: './view-request.component.html',
	styleUrl: './view-request.component.scss',
})
export class ViewRequestComponent implements AfterViewInit {
	@ViewChild(MatSort) sort!: MatSort;
	@ViewChild(MatPaginator) paginator!: MatPaginator;
	requestId: number | undefined;

	subscriptions: Subscription[] = [];
	
	files: any[] = [];
	fileCount = signal(0);
	requestPageCounter = signal(0);
	
	matcher = new MyErrorStateMatcher();
	copies = new MatTableDataSource<CopyInterface>();
	route = inject(ActivatedRoute);
	actionService = inject(ActionService);
	dialogService = inject(DialogService);
	requestService = inject(RequestService);

	allowedActions = actions.allowedActionsforViewRequest;
	pageType = PageType.viewRequest;

	displayedColumns: string[] = [
		'fileName',
		'pageCount',
		'copyCount',
		'actions',
	];

	// copyNumFormControl = new FormControl(10, [
	// 	Validators.required,
	// 	Validators.min(1),
	// ]);

	ngAfterViewInit() {
		this.requestId = +this.route.snapshot.paramMap.get('id')!;
		this.copies.sort = this.sort;
		this.copies.paginator = this.paginator;

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

		this.subscriptions.push(
			this.actionService.downloadCopy.subscribe((copy) => {
				this.downloadFile(copy);
			})
		);

		this.subscriptions.push(
			this.requestService
				.getCopiesFromRequest(this.requestId)
				.subscribe((copies) => {
					this.copies.data = copies;
					this.refreshTable();
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
			.subscribe((result: boolean) => {
				if (result) {
					const copyIndex = this.copies.data.indexOf(copy);

					if (copyIndex >= 0) {
						this.copies.data.splice(copyIndex, 1);
						this.files.splice(copyIndex, 1);

						this.refreshTable();
					}
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

	downloadFile(element: any) {
		console.log('Baixando arquivo...');
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
			counter += copy.pageCount * copy.copyCount;
		});

		this.requestPageCounter.set(counter);
	}

	// Unsubscribe para prevenir memory leak
	ngOnDestroy(): void {
		this.subscriptions.forEach((subscription) => {
			subscription.unsubscribe();
		});
	}
}
