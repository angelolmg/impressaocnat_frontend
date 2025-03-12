import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router, RouterLink } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { UserData } from '../../models/userData.interface';
import {
	ActionService,
	DEFAULT_USER_INFO,
	Option,
	User,
} from '../../service/action.service';
import { UserService } from '../../service/user.service';
import { DEFAULT_USER_OPTIONS } from './../../service/action.service';

@Component({
	selector: 'app-navbar',
	imports: [
		MatIconModule,
		MatButtonModule,
		RouterLink,
		MatTooltipModule,
		CommonModule,
	],
	templateUrl: './navbar.component.html',
	styleUrl: './navbar.component.scss',
})
export class NavbarComponent {
	private ngUnsubscribe = new Subject<void>();
	actionService = inject(ActionService);
	userService = inject(UserService);
	router = inject(Router);

	// Projetar constante para poder usar no template
	defaultUserInfo = DEFAULT_USER_INFO;

	userSignal = signal<User>(this.defaultUserInfo);
	options = signal<Option[]>([]);

	ngAfterViewInit(): void {
		this.setOptionsDefault();
		this.userService.userUpdate
			.pipe(takeUntil(this.ngUnsubscribe))
			.subscribe((data) => {
				this.updateUser(data);
			});
	}

	toggleDrawer() {
		this.actionService.toggleSideMenuUI.emit();
	}

	updateUser(user?: UserData) {
		if (user && user.matricula && user.nome_usual && user.url_foto_75x100) {
			// Desestruturação de objeto
			// https://www.w3schools.com/js/js_destructuring.asp
			const {
				matricula: registration,
				nome_usual: name,
				url_foto_75x100: pfp,
			} = user;

			this.userSignal.set({
				registration,
				name,
				pfp,
			});
		} else {
			this.resetUser();
		}
	}

	private resetUser() {
		this.userSignal.set(this.defaultUserInfo);
		this.setOptionsDefault();
	}

	setOptionsDefault() {
		this.options.set(DEFAULT_USER_OPTIONS);
	}

	logoutUser() {
		this.userService.logoutUser();
		this.updateUser();
		this.router.navigate(['']);
		console.log('Usuário desconectado com sucesso.');
	}

	// Unsubscribe para prevenir memory leak
	ngOnDestroy() {
		this.ngUnsubscribe.next();
		this.ngUnsubscribe.complete();
	}
}
