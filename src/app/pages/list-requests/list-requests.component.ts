import { DatePipe } from '@angular/common';
import { AfterViewInit, ChangeDetectionStrategy, Component, inject, OnDestroy, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subscription } from 'rxjs';
import { DialogBoxComponent } from '../../components/dialog-box/dialog-box.component';
import { REQUEST_DATA, RequestInterface } from '../../models/request.interface';
import { IconPipe } from '../../pipes/icon.pipe';
import {
	actions,
	ActionService,
	ActionType,
	PageType,
} from '../../service/action.service';
import { DialogService } from '../../service/dialog.service';

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
		'creationDate',
		'term',
		'conclusionDate',
		'actions',
	];

	allowedActions: ActionType[] = [];

	dialogService = inject(DialogService);
	actionService = inject(ActionService);
	pageType = PageType.viewAllRequests;

	requests = new MatTableDataSource<RequestInterface>(REQUEST_DATA);

	@ViewChild(MatSort) sort!: MatSort;
	@ViewChild(MatPaginator) paginator!: MatPaginator;

	subscriptions: Subscription[] = [];

	ngAfterViewInit() {
		this.requests.sort = this.sort;
		this.requests.paginator = this.paginator;

		if (this.pageType == PageType.viewAllRequests)
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

		this.subscriptions.push(
			this.actionService.viewRequest.subscribe((request) => {
				this.viewRequestRedirect(request);
			})
		);

		this.subscriptions.push(
			this.actionService.closeRequest.subscribe((request) => {
				this.closeRequest(request);
			})
		);

		this.subscriptions.push(
			this.actionService.openRequest.subscribe((request) => {
				this.openRequest(request);
			})
		);
	}

	openRequest(request: RequestInterface) {
		console.log("Abrindo solicitação...");
		
		console.log(request);
		
	}
	closeRequest(request: RequestInterface) {
		console.log("Fechando solicitação...");
		
		console.log(request);
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
		console.log(request);
		
	}

	viewRequestRedirect(request: RequestInterface) {
		console.log('Ver solicitação...');
		console.log(request);

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
