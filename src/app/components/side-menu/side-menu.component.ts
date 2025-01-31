import { AfterViewInit, Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DialogService } from '../../service/dialog.service';
import { LoginBoxComponent } from '../login-box/login-box.component';
import { userData } from '../../models/userData.interface';
import { UserService } from '../../service/user.service';

interface Option {
	icon: string;
	text: string;
	routerLink: string;
}

interface User {
	registration: string;
	name: string;
	pfp: string;
}

@Component({
	selector: 'app-side-menu',
	imports: [RouterLink, MatIconModule, MatButtonModule, MatTooltipModule],
	templateUrl: './side-menu.component.html',
	styleUrl: './side-menu.component.scss',
})
export class SideMenuComponent implements AfterViewInit {
	dialogService = inject(DialogService);
	userService = inject(UserService);
	router = inject(Router);

	defaultUser = {
		registration: '123456',
		name: 'Fulano de Tal',
		pfp: 'assets/user-01.svg',
	};

	userSignal = signal<User>(this.defaultUser);
	options = signal<Option[]>([]);

	ngAfterViewInit(): void {
		this.options.set([
			{
				icon: 'add_circle',
				text: 'Nova Solicitação',
				routerLink: 'nova-solicitacao',
			},
			{
				icon: 'list',
				text: 'Minhas Solicitações',
				routerLink: 'minhas-solicitacoes',
			},
		]);

		this.userService.userUpdate.subscribe((data) => {
			this.updateUser(data);
			if (this.userService.getCurrentUser()?.is_admin) {
				
				this.options.update((curr) =>
					curr.concat([
						{
							icon: 'receipt_long',
							text: 'Todas as Solicitações',
							routerLink: 'solicitacoes',
						},
					])
				);
			}
		});
	}

	loginDialog() {
		this.dialogService.openDialog(LoginBoxComponent);
	}

	logoutUser() {
		this.userService.logoutUser();
		this.updateUser();
		this.router.navigate(['redirect']);
		console.log('Usuário desconectado com sucesso.');
	}

	updateUser(user?: userData) {
		if (user) {
			this.userSignal.set({
				registration: user.matricula,
				name: user.nome_usual,
				pfp: user.url_foto_75x100,
			});
		} else {
			this.userSignal.set(this.defaultUser);
		}
	}
}
