import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import {MatButtonModule} from '@angular/material/button';

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
	imports: [RouterLink, MatIconModule, MatButtonModule],
	templateUrl: './side-menu.component.html',
	styleUrl: './side-menu.component.scss',
})
export class SideMenuComponent {
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
			icon: 'list',
			text: 'Todas as Solicitações',
			routerLink: 'listar-solicitacoes',
		},
	];
}
