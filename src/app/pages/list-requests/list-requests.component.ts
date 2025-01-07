import { AfterViewInit, Component, ViewChild } from '@angular/core';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';

import { ChangeDetectionStrategy, inject} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { DialogService } from '../../service/dialog.service';
import { DialogData } from '../../models/dialogData.interface';
import { REQUEST_DATA, RequestInterface } from '../../models/request.interface';
import { DatePipe } from '@angular/common';
import { IconPipe } from '../../pipes/icon.pipe';

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
	],
	templateUrl: './list-requests.component.html',
	styleUrl: './list-requests.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListRequestsComponent implements AfterViewInit {
	displayedColumns: string[] = [
		'registration',
		'username',
		'creation_date',
		'term',
		'conclusion_date',
		'actions',
	];

	allowedActions: string[] = [
		'Visualizar',
		'Concluir',
		'Editar',
		'Excluir',
		// 'Abrir',
		// 'Download',
	];

	dataSource = new MatTableDataSource(REQUEST_DATA);
	dialogService = inject(DialogService);

	@ViewChild(MatSort) sort!: MatSort;

	ngAfterViewInit() {
		this.dataSource.sort = this.sort;
	}

	data: DialogData = {
		title: 'Excluir Solicitação',
		message: 'Deseja realmente excluir N°00011?',
	};

	openDialog() {
		this.dialogService
			.openDialog(this.data)
			.afterClosed()
			.subscribe((result) => {
				console.log(result);
			});
	}

	checkDisabled(action: string, element: RequestInterface) {
		if (element.conclusion_date) {
			if(action == 'Concluir' || action == 'Editar') {
				return true;
			}
		}

		return false;
	}
}
