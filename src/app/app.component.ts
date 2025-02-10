import {
  AfterViewInit,
  Component,
  inject,
  OnInit
} from '@angular/core';
import {
  NavigationEnd,
  Router,
  RouterOutlet
} from '@angular/router';
import { LoginBoxComponent } from './components/login-box/login-box.component';
import { SideMenuComponent } from './components/side-menu/side-menu.component';
import { DialogService } from './service/dialog.service';
import { UserService } from './service/user.service';

@Component({
	selector: 'app-root',
	imports: [RouterOutlet, SideMenuComponent],
	templateUrl: './app.component.html',
	styleUrl: './app.component.scss',
})
export class AppComponent implements AfterViewInit, OnInit {
	ngAfterViewInit(): void {}
	title = 'impressaocnat_frontend';

	router = inject(Router);
	userService = inject(UserService);
	dialogService = inject(DialogService);

	ngOnInit() {
		this.router.events.subscribe((event) => {
			if (event instanceof NavigationEnd) {
				
				// Caso token esteja expirado, desconectar usuário automaticamente
				if (this.userService.isTokenExpired())
					this.userService.logoutUser()
				
				// Abrir dialogo de login caso o usuário não esteja logado
				// Não abrir dialogo na tela de redirecionamento
				if (
					event.url != '/redirect' &&
					!this.userService.isLoggedIn()
				) {
		
					this.dialogService.openDialog(LoginBoxComponent, {}, true);
				}
			}
		});
	}
}
