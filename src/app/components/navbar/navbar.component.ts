import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router, RouterLink } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import {
	ActionService,
	DEFAULT_USER_PROFILE,
	Option,
} from '../../service/action.service';
import { UserService } from '../../service/user.service';
import { DEFAULT_USER_OPTIONS } from './../../service/action.service';
import { User } from '../../models/user.interface';

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
	/** Subject para gerenciar o unsubscribe de EventEmitters */
	private ngUnsubscribe = new Subject<void>();

	/** Logo do cabeçalho da aplicação. */
	headerLogo: string = '🖨️';

	/** Serviços */
	actionService = inject(ActionService);
	userService = inject(UserService);
	router = inject(Router);

	/** Informações padrão do usuário */
	defaultUserInfo = DEFAULT_USER_PROFILE;

	/** Signal contendo as informações do usuário. */
	userSignal = signal<User>(this.defaultUserInfo);

	/** Signal contendo as opções do usuário. */
	options = signal<Option[]>([]);

	/**
	 * Inicializa a view após a primeira detecção de mudanças.
	 *
	 * Define as opções padrão do usuário e inscreve-se para receber atualizações do usuário através do UserService.
	 */
	ngAfterViewInit(): void {
		// Define as opções padrão do usuário.
		this.setOptionsDefault();

		// Inscreve-se para receber atualizações do usuário através do UserService.
		this.userService.userUpdate$
			.pipe(takeUntil(this.ngUnsubscribe)) // Garante que a inscrição seja cancelada ao destruir o componente.
			.subscribe((user) => {
				// Atualiza as informações do usuário com os dados recebidos.
				this.updateUser(user);
			});
	}

	/**
	 * Alterna a visibilidade do menu lateral.
	 */
	toggleDrawer(): void {
		this.actionService.toggleSideMenuUI.emit();
	}

	/**
	 * Atualiza as informações do usuário no signal.
	 *
	 * Se um objeto User for fornecido e contiver todas as propriedades necessárias,
	 * as informações do usuário serão atualizadas. Caso contrário, as informações do usuário
	 * serão redefinidas para o estado padrão.
	 *
	 * @param {User} [user] - O objeto SuapUserData contendo as novas informações do usuário.
	 */
	updateUser(user?: User): void {
		if (!user) {
			this.resetUser();
		} else {
			this.userSignal.set(user);
		}
	}

	/**
	 * Redefine as informações do usuário para o estado padrão.
	 */
	private resetUser(): void {
		this.userSignal.set(this.defaultUserInfo);
		this.setOptionsDefault();
	}

	/**
	 * Define as opções do usuário para os valores padrão.
	 */
	setOptionsDefault(): void {
		this.options.set(DEFAULT_USER_OPTIONS);
	}

	/**
	 * Desconecta o usuário e redireciona para a página inicial.
	 */
	logoutUser(): void {
		this.userService.logoutUser();
		this.updateUser();
		this.router.navigate(['']);
		console.info('Usuário desconectado com sucesso');
	}

	/**
	 * Método do ciclo de vida chamado quando o componente é destruído.
	 *
	 * Desinscreve observables para prevenir memory leaks.
	 */
	ngOnDestroy(): void {
		this.ngUnsubscribe.next();
		this.ngUnsubscribe.complete();
	}
}
