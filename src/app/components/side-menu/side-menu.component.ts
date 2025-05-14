import {
	AfterViewInit,
	Component,
	inject,
	signal,
	ViewChild,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDrawer, MatSidenavModule } from '@angular/material/sidenav';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { ActionService, Option } from '../../service/action.service';
import { DialogService } from '../../service/dialog.service';
import { UserService } from '../../service/user.service';
import {
	ADMIN_USER_OPTIONS,
	DEFAULT_USER_OPTIONS,
} from './../../service/action.service';
import { Role } from '../../models/enums/role.enum';
import { User } from '../../models/user.interface';

@Component({
	selector: 'app-side-menu',
	imports: [
		RouterLink,
		MatIconModule,
		MatButtonModule,
		MatTooltipModule,
		MatSidenavModule,
	],
	templateUrl: './side-menu.component.html',
	styleUrl: './side-menu.component.scss',
})
export class SideMenuComponent implements AfterViewInit {
	/** Serviços */
	dialogService = inject(DialogService);
	userService = inject(UserService);
	actionService = inject(ActionService);
	router = inject(Router);

	/** Subject para desinscrever observables e prevenir memory leaks. */
	private ngUnsubscribe = new Subject<void>();

	/** Rota atual da aplicação. */
	currentRoute: string = '';

	/** Sinal para armazenar as opções do menu lateral. */
	sideMenuOptions = signal<Option[]>([]);

	/** Referência ao componente MatDrawer. */
	@ViewChild(MatDrawer) drawer!: MatDrawer;

	/**
	 * Método do ciclo de vida chamado após a inicialização da view.
	 *
	 * Inicializa a rota atual, define as opções padrão do menu,
	 * observa mudanças no usuário e ações do serviço.
	 */
	ngAfterViewInit(): void {
		// Observa eventos de roteamento para atualizar a rota atual.
		this.router.events.subscribe((event) => {
			if (event instanceof NavigationEnd) {
				this.currentRoute = event.url.slice(1);
			}
		});

		// Define as opções padrão do menu.
		this.setMenuOptionsDefault();

		// Observa mudanças no usuário para atualizar as opções do menu.
		this.userService.userUpdate$
			.pipe(takeUntil(this.ngUnsubscribe))
			.subscribe((currUser) => {
				if (
					currUser &&
					(currUser.role == Role.ADMIN ||
						currUser.role == Role.MANAGER)
				) {
					// Atualiza as opções do menu para usuários com permissões de ADMIN ou MANAGER.
					this.sideMenuOptions.update((curr: Option[]) => {
						// Filtra as opções do menu para incluir apenas as que não estão presentes atualmente.
						const newOptions = ADMIN_USER_OPTIONS.filter(
							(option) =>
								!curr.some(
									(existingOption) =>
										existingOption.routerLink ===
										option.routerLink
								)
						);
						return curr.concat(newOptions);
					});
				}
			});

		// Observa ações para alternar a visibilidade do menu lateral.
		this.actionService.toggleSideMenuUI
			.pipe(takeUntil(this.ngUnsubscribe))
			.subscribe(() => {
				this.toggleDrawer();
			});
	}

	/** Alterna a visibilidade do menu lateral. */
	toggleDrawer(): void {
		this.drawer.toggle();
	}

	/** Define as opções padrão do menu lateral. */
	setMenuOptionsDefault(): void {
		this.sideMenuOptions.set(DEFAULT_USER_OPTIONS);
	}

	/**
	 * Verifica se uma opção do menu está selecionada com base na rota atual.
	 *
	 * @param {string} route A rota da opção do menu.
	 * @returns {boolean} Retorna true se a opção estiver selecionada, false caso contrário.
	 */
	menuOptionSelected(route: string): boolean {
		let parentRoute: string = this.currentRoute.split('/')[0];
		let onRoute: boolean = !!parentRoute && route == parentRoute;
		return onRoute;
	}

	/** Obtém o ano atual. */
	getCurrentYear(): number {
		return new Date().getFullYear();
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
