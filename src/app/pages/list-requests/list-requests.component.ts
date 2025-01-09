import { AfterViewInit, Component, ViewChild } from '@angular/core';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';

import { MatBadgeModule } from '@angular/material/badge';

import { ChangeDetectionStrategy, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { DialogService } from '../../service/dialog.service';
import { DialogData } from '../../models/dialogData.interface';
import { REQUEST_DATA, RequestInterface } from '../../models/request.interface';
import { DatePipe } from '@angular/common';
import { IconPipe } from '../../pipes/icon.pipe';
import { ActionService } from '../../service/action.service';
import { DialogBoxComponent } from '../../components/dialog-box/dialog-box.component';

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
		MatBadgeModule,
	],
	templateUrl: './list-requests.component.html',
	styleUrl: './list-requests.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListRequestsComponent implements AfterViewInit {
	displayedColumns: string[] = [
		'id',
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

	dialogService = inject(DialogService);
	actionService = inject(ActionService);

	dataSource = new MatTableDataSource<RequestInterface>(REQUEST_DATA);
	data: DialogData = {
		title: 'Excluir Solicitação',
		message: 'Deseja realmente excluir N°00011?',
		positive_label: 'Sim',
		negative_label: 'Não'
	};

	@ViewChild(MatSort) sort!: MatSort;
	@ViewChild(MatPaginator) paginator!: MatPaginator;

	ngAfterViewInit() {
		this.dataSource.sort = this.sort;
		this.dataSource.paginator = this.paginator;
	}

	openDialog() {
		this.dialogService
			.openDialog(this.data, DialogBoxComponent)
			.afterClosed()
			.subscribe((result) => {
				console.log(result);
			});
	}

}
