import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatRippleModule } from '@angular/material/core';
import { MatDialogContent, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { UserService } from '../../service/user.service';

@Component({
	selector: 'app-login-box',
	imports: [
		MatDialogModule,
		MatFormFieldModule,
		MatInputModule,
		FormsModule,
		MatButtonModule,
		MatDialogContent,
    MatRippleModule
	],
	templateUrl: './login-box.component.html',
	styleUrl: './login-box.component.scss',
})
export class LoginBoxComponent {
	readonly dialogRef = inject(MatDialogRef<LoginBoxComponent>);
	// readonly data = inject<DialogData>(MAT_DIALOG_DATA);
  loginTitle: string = 'Solicitação de Cópias - CNAT'
  loginButtonText: string = 'Conectar via SUAP'
  userService = inject(UserService);

	onNoClick(): void {
		this.dialogRef.close();
	}

}
