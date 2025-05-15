import { Component, inject, OnInit } from '@angular/core';
import {
	NavigationEnd,
	NavigationStart,
	Router,
	RouterOutlet,
} from '@angular/router';
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

	private router = inject(Router);
	private userService = inject(UserService);
	private dialogService = inject(DialogService);

	ngOnInit() {
		this.router.events.subscribe((event) => {
			if (event instanceof NavigationStart) {
				// Verifica se o usuário está logado e está sendo redirecionado para /solicitacoes: abre pop-up de login
				// Esse redirecionamento para /solicitacoes geralmente pode vir através de link do email de notificação, ao clicar "Acessar solicitação"
				if (
					!this.userService.isLoggedIn() &&
					event.url.startsWith('/solicitacoes')
				) {
					this.openLoginDialog();
				}

				// Evita lógica de redirecionamento na página de redirecionamento
				if (event.url.startsWith('/redirect')) return;

				// Salva URL para redirecionamento
				// Isso é necessário para que o usuário seja redirecionado para a página correta após o redirect do login SUAP
				if (event.url !== '/') {
					localStorage.setItem('impressaocnat:redirectTo', event.url);
				}
			}

			if (event instanceof NavigationEnd) {
				// Expira token se necessário
				if (this.userService.isTokenExpired()) {
					this.userService.logoutUser();
				}

				if (!this.userService.isLoggedIn()) {
					this.openLoginDialog();
				}
			}
		});
	}

	private openLoginDialog(): void {
		this.dialogService.openDialog(LoginBoxComponent, {}, true);
	}
}
