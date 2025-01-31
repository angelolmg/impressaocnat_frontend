import { Component, inject } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { finalize, Subscription } from 'rxjs';
import { UserService } from '../../service/user.service';
import { AuthService } from './../../service/auth.service';

@Component({
	selector: 'app-redirect',
	imports: [MatProgressSpinnerModule],
	templateUrl: './redirect.component.html',
	styleUrl: './redirect.component.scss',
})
export class RedirectComponent {
	userInit = new Subscription();
	authService = inject(AuthService);
	userService = inject(UserService);
	router = inject(Router);

	constructor() {
		this.authService.client.initializeToken('uri');
		this.userService
			.fetchUserData()
			.pipe(finalize(() => this.router.navigate(['nova-solicitacao'])))
			.subscribe({
				error: (err) => console.warn(err),
			});
	}
}
