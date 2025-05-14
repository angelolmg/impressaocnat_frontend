import { Component, inject, OnInit } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { LoginBoxComponent } from './components/login-box/login-box.component';
import { NavbarComponent } from './components/navbar/navbar.component';
import { SideMenuComponent } from './components/side-menu/side-menu.component';
import { DialogService } from './service/dialog.service';
import { UserService } from './service/user.service';

@Component({
	selector: 'app-root',
	imports: [RouterOutlet, SideMenuComponent, NavbarComponent],
	templateUrl: './app.component.html',
	styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
	title = 'impressaocnat_frontend';

	/** Serviços */
	router = inject(Router);
	userService = inject(UserService);
	dialogService = inject(DialogService);

	ngOnInit() {
		this.router.events.subscribe((event) => {
			// Verifica se o evento é uma mudança de rota (NavigationEnd).
			if (event instanceof NavigationEnd) {
				// Verifica se o token de autenticação está expirado e realiza logout se necessário.
				if (this.userService.isTokenExpired())
					this.userService.logoutUser();

				// Abrir dialogo de login caso o usuário não esteja logado
				// Não abrir dialogo na tela de redirecionamento
				if (!event.url.startsWith('/redirect')) {
					// Salva a URL atual no localStorage para redirecionamento posterior.
					// Isso é útil para redirecionar o usuário após o login.
					if (event.url != '/') {
						localStorage.setItem(
							'impressaocnat:redirectTo',
							event.url
						);
					}

					if (!this.userService.isLoggedIn()) {
						this.dialogService.openDialog(
							LoginBoxComponent,
							{},
							true
						);
					}
				}
			}
		});
	}
}
