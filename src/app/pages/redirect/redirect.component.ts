import { Component, inject } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { UserService } from '../../service/user.service';
import { AuthService } from './../../service/auth.service';

/**
 * Componente de redirecionamento do login OAuth2 para tela principal
 * 
 * Inicializa o token por meio da URI, busca e armazena dados do usuário e redireciona
 */
@Component({
	selector: 'app-redirect',
	imports: [MatProgressSpinnerModule],
	templateUrl: './redirect.component.html',
	styleUrl: './redirect.component.scss',
})
export class RedirectComponent {
	// Serviços
	authService = inject(AuthService);
	userService = inject(UserService);
	router = inject(Router);

	constructor() {
		// Inicializa implicit token a partir da URL de redirecionamento
		this.authService.client.initializeToken('uri');

		// Busca dados do usuário a partir do token passado
		this.userService
			.fetchUserData()
			.pipe(finalize(() => this.router.navigate(['nova-solicitacao'])))
			.subscribe({
				error: (err) => console.warn(err),
			});
	}
}