import {
	AfterViewInit,
	Component,
	inject,
	signal,
	ViewChild
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDrawer, MatSidenavModule } from '@angular/material/sidenav';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router, RouterLink } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { ActionService, Option } from '../../service/action.service';
import { DialogService } from '../../service/dialog.service';
import { UserService } from '../../service/user.service';
import {
	ADMIN_USER_OPTIONS,
	DEFAULT_USER_OPTIONS
} from './../../service/action.service';

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
	private ngUnsubscribe = new Subject<void>();
	dialogService = inject(DialogService);
	userService = inject(UserService);
	actionService = inject(ActionService);
	router = inject(Router);

	options = signal<Option[]>([]);

	@ViewChild(MatDrawer) drawer!: MatDrawer;

	ngAfterViewInit(): void {
		this.setOptionsDefault();

		this.userService.userUpdate
			.pipe(takeUntil(this.ngUnsubscribe))
			.subscribe(() => {
				if (this.userService.getCurrentUser()?.is_admin) {
					this.options.update((curr) =>
						curr.concat(ADMIN_USER_OPTIONS)
					);
				}
			});

		this.actionService.toggleSideMenuUI
			.pipe(takeUntil(this.ngUnsubscribe))
			.subscribe(() => {
				this.toggleDrawer();
			});
	}

	toggleDrawer() {
		this.drawer.toggle();
	}

	setOptionsDefault() {
		this.options.set(DEFAULT_USER_OPTIONS);
	}

	// Unsubscribe para prevenir memory leak
	ngOnDestroy() {
		this.ngUnsubscribe.next();
		this.ngUnsubscribe.complete();
	}
}
