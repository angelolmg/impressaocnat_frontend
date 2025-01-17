import { Component, inject } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { UserService } from '../../service/user.service';
import { userData } from '../../models/userData.interface';

@Component({
	selector: 'app-redirect',
	imports: [MatProgressSpinnerModule],
	templateUrl: './redirect.component.html',
	styleUrl: './redirect.component.scss',
})
export class RedirectComponent {
	constructor() {
		var userService = inject(UserService);
		var router = inject(Router);
		userService.client.extractInfoFromURI();

		userService.getUserData().subscribe({
			next: (data: userData) => {
				console.log(data);
        userService.setUser(data);
			},
			error: (err) => console.error('Um erro ocorreu:', err),
			complete: () => console.log('Procedimento de login concluído'),
		});

		router.navigate(['']);
	}
}
