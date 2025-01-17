import { AfterViewInit, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
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
export class SideMenuComponent implements AfterViewInit{
	
	dialogService = inject(DialogService);
	userService = inject(UserService);


	ngAfterViewInit(): void {
		this.userService.userUpdate.subscribe((data) => {
			this.setUser(data);
		});
	}

	userSignal = signal<User>({
		registration: '123456',
		name: 'Fulano de Tal',
		pfp: 'assets/user-01.svg'
	});

	options: Option[] = [
		{
			icon: 'add_circle',
			text: 'Nova Solicitação',
			routerLink: 'formulario-solicitacao',
		},
		{
			icon: 'list',
			text: 'Minhas Solicitações',
			routerLink: 'listar-solicitacoes',
		},
		{
			icon: 'receipt_long',
			text: 'Todas as Solicitações',
			routerLink: 'ver-solicitacao',
		},
	];

	loginDialog() {
		this.dialogService.openDialog(LoginBoxComponent);
	}

	setUser(user: userData) {
		this.userSignal.set({
			registration: user.matricula,
			name: user.nome_usual,
			pfp: user.url_foto_75x100
		})
	}
}
