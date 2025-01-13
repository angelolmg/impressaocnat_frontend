import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import {MatButtonModule} from '@angular/material/button';
import {MatTooltipModule} from '@angular/material/tooltip';
import { DialogService } from '../../service/dialog.service';
import { LoginBoxComponent } from '../login-box/login-box.component';

interface Option {
	icon: string;
	text: string;
	routerLink: string;
}

interface User {
	id: string;
	name: string;
}

@Component({
	selector: 'app-side-menu',
	imports: [RouterLink, MatIconModule, MatButtonModule, MatTooltipModule],
	templateUrl: './side-menu.component.html',
	styleUrl: './side-menu.component.scss',
})
export class SideMenuComponent {

	dialogService = inject(DialogService);

	user: User = {
		id: '123456',
		name: 'Fulano de Tal',
	};

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
}
