import { Component, inject } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { UserService } from '../../service/user.service';

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
		router.navigate(['']);
	}
}
