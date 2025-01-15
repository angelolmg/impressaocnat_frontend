import { AfterViewInit, Component, OnDestroy, ViewChild } from '@angular/core';
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
import {
	actions,
	ActionService,
	actionType,
	PageState,
} from '../../service/action.service';
import { DialogBoxComponent } from '../../components/dialog-box/dialog-box.component';
import { Subscription } from 'rxjs';

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
export class ListRequestsComponent implements AfterViewInit, OnDestroy {
	displayedColumns: string[] = [
		'id',
		'registration',
		'username',
		'creation_date',
		'term',
		'conclusion_date',
		'actions',
	];

	allowedActions: actionType[] = [];

	dialogService = inject(DialogService);
	actionService = inject(ActionService);
	pageState = PageState.viewMyRequests;

	requests = new MatTableDataSource<RequestInterface>(REQUEST_DATA);

	@ViewChild(MatSort) sort!: MatSort;
	@ViewChild(MatPaginator) paginator!: MatPaginator;

	subscriptions: Subscription[] = [];

	ngAfterViewInit() {
		this.requests.sort = this.sort;
		this.requests.paginator = this.paginator;

		if (this.pageState == PageState.viewAllRequests)
			this.allowedActions = actions.allowedActionsforViewAllRequests;
		else this.allowedActions = actions.allowedActionsforViewMyRequests;

		this.subscriptions.push(
			this.actionService.deleteRequest.subscribe((request) => {
				this.removeRequest(request);
			})
		);

		this.subscriptions.push(
			this.actionService.editRequest.subscribe((request) => {
				this.editRequestRedirect(request);
			})
		);
	}

	removeRequest(request: RequestInterface) {
		this.dialogService
			.openDialog(DialogBoxComponent, {
				title: 'Excluir solicitação',
				message:
					'Deseja realmente excluir solicitação Nº' +
					request.id +
					'?',
				warning: 'Esta ação é permanente',
				positive_label: 'Sim',
				negative_label: 'Não',
			})
			.afterClosed()
			.subscribe((result) => {
				if (result) {
					const requestIndex = this.requests.data.indexOf(request);

					if (requestIndex >= 0) {
						this.requests.data.splice(requestIndex, 1);

						this.refreshTable();
					}
				}
			});
	}

	editRequestRedirect(request: RequestInterface) {
		console.log('Editando solicitação...');
	}

	refreshTable() {
		// Refresh the data source object
		// Angular Material is weird
		this.requests.data = this.requests.data;
	}

	// Unsubscribe para prevenir memory leak
	ngOnDestroy(): void {
		this.subscriptions.forEach((subscription) => {
			subscription.unsubscribe();
		})
	}
}
