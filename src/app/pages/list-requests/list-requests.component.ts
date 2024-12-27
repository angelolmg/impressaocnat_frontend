import { AfterViewInit, Component, ViewChild } from '@angular/core';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';

import {
  ChangeDetectionStrategy,
  inject,
  model,
  signal
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MatDialog
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { DialogBoxComponent } from '../../components/dialog-box/dialog-box.component';

export interface PeriodicElement {
	name: string;
	position: number;
	weight: number;
	symbol: string;
}

const ELEMENT_DATA: PeriodicElement[] = [
	{ position: 1, name: 'Hydrogen', weight: 1.0079, symbol: 'H' },
	{ position: 2, name: 'Helium', weight: 4.0026, symbol: 'He' },
	{ position: 3, name: 'Lithium', weight: 6.941, symbol: 'Li' },
	{ position: 4, name: 'Beryllium', weight: 9.0122, symbol: 'Be' },
	{ position: 5, name: 'Boron', weight: 10.811, symbol: 'B' },
	{ position: 6, name: 'Carbon', weight: 12.0107, symbol: 'C' },
	{ position: 7, name: 'Nitrogen', weight: 14.0067, symbol: 'N' },
	{ position: 8, name: 'Oxygen', weight: 15.9994, symbol: 'O' },
	{ position: 9, name: 'Fluorine', weight: 18.9984, symbol: 'F' },
	{ position: 10, name: 'Neon', weight: 20.1797, symbol: 'Ne' },
];

export interface DialogData {
	animal: string;
	name: string;
}

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
	],
	templateUrl: './list-requests.component.html',
	styleUrl: './list-requests.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListRequestsComponent implements AfterViewInit {
	displayedColumns: string[] = ['position', 'name', 'weight', 'symbol'];
	dataSource = new MatTableDataSource(ELEMENT_DATA);

	@ViewChild(MatSort) sort!: MatSort;

	ngAfterViewInit() {
		this.dataSource.sort = this.sort;
	}

	readonly animal = signal('');
	readonly name = model('');
	readonly dialog = inject(MatDialog);

	openDialog(): void {
		const dialogRef = this.dialog.open(DialogBoxComponent, {
			data: { name: this.name(), animal: this.animal() },
		});

		dialogRef.afterClosed().subscribe((result) => {
			console.log('The dialog was closed');
			if (result !== undefined) {
				this.animal.set(result);
			}
		});
	}
}
