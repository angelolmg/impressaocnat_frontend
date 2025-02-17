import { ComponentFixture, TestBed } from '@angular/core/testing';

import { provideHttpClient } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { routes } from '../../app.routes';
import { SideMenuComponent } from './side-menu.component';

describe('SideMenuComponent', () => {
	let component: SideMenuComponent;
	let fixture: ComponentFixture<SideMenuComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [SideMenuComponent],
			providers: [
				provideHttpClient(),
				provideRouter(routes),
				provideAnimations(),
			],
		}).compileComponents();

		fixture = TestBed.createComponent(SideMenuComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
