import { Injectable } from '@angular/core';
import {
	ActivatedRouteSnapshot,
	CanActivate,
	Router,
	RouterStateSnapshot,
	UrlTree,
} from '@angular/router';
import { catchError, filter, map, Observable, of, take } from 'rxjs';
import { Role } from '../models/enums/role.enum';
import { UserService } from '../service/user.service';

@Injectable({ providedIn: 'root' })
export class AllSolicitationsGuard implements CanActivate {
	constructor(private userService: UserService, private router: Router) {}

	canActivate(
		route: ActivatedRouteSnapshot,
		state: RouterStateSnapshot
	): Observable<boolean | UrlTree> {
		const allRoute = 'solicitacoes';
		const myRoute = 'minhas-solicitacoes';

		return this.userService.userUpdate$.pipe(
			filter((currentUser) => currentUser != null),
			take(1),
			map((currentUser) => {
				if (
					currentUser.role === Role.ADMIN ||
					currentUser.role === Role.MANAGER
				) {
					return true; // Permite acesso a rota /solicitacoes
				}

                // Se o usuário não for ADMIN ou MANAGER, redireciona para /minhas-solicitacoes
				const url = state.url;

				if (url === `/${allRoute}` || url === `/${myRoute}`) {
					return this.router.parseUrl(`/${myRoute}`);
				}

				const viewMatch = url.match(
					new RegExp(`^/${allRoute}/ver/(\\d+)$`)
				);
				if (viewMatch) {
					return this.router.parseUrl(
						`/${myRoute}/ver/${viewMatch[1]}`
					);
				}

				const editMatch = url.match(
					new RegExp(`^/${allRoute}/editar/(\\d+)$`)
				);
				if (editMatch) {
					return this.router.parseUrl(
						`/${myRoute}/editar/${editMatch[1]}`
					);
				}

				// Redirecionamento padrão
				return this.router.parseUrl(`/${myRoute}`);
			}),
			catchError((err) => {
				console.error('Erro ao obter dados do usuário:', err);
				return of(this.router.parseUrl(`/${myRoute}`));
			})
		);
	}
}
