import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
	MAT_DIALOG_DATA,
	MatDialogActions,
	MatDialogClose,
	MatDialogContent,
	MatDialogModule,
	MatDialogRef,
	MatDialogTitle,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { CopyInterface } from '../../models/copy.interface';
import { DialogDataInput } from '../../models/dialogData.interface';

@Component({
	selector: 'app-config-box',
	imports: [
		MatDialogModule,
		MatFormFieldModule,
		MatInputModule,
		FormsModule,
		MatButtonModule,
		MatDialogTitle,
		MatDialogContent,
		MatDialogActions,
		MatDialogClose,
	],
	templateUrl: './config-box.component.html',
	styleUrl: './config-box.component.scss',
})
export class ConfigBoxComponent {
	readonly dialogRef = inject(MatDialogRef<ConfigBoxComponent>);
	readonly data = inject<DialogDataInput>(MAT_DIALOG_DATA);

	copy = this.data.data as CopyInterface;
}
