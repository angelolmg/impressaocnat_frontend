import { Component, inject, OnDestroy } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { UserService } from '../../service/user.service';
import { userData } from '../../models/userData.interface';
import { Subscription } from 'rxjs';

@Component({
	selector: 'app-redirect',
	imports: [MatProgressSpinnerModule],
	templateUrl: './redirect.component.html',
	styleUrl: './redirect.component.scss',
})
export class RedirectComponent implements OnDestroy {
	userInit = new Subscription();

	constructor() {
		var userService = inject(UserService);
		var router = inject(Router);

		userService.client.initializeToken('uri');

		this.userInit = userService.getUserData().subscribe({
			next: (data: userData) => {
				userService.setUser(data);
			},
			error: (err) => {
				console.error(err);
			},
			complete: () => {
				console.log('Procedimento de login concluído');
				router.navigate(['']);
			},
		});
	}
	ngOnDestroy(): void {
		this.userInit.unsubscribe();
	}
}
