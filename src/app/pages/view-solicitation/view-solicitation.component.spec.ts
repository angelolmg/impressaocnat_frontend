import { ComponentFixture, TestBed } from '@angular/core/testing';

import { provideHttpClient } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter } from '@angular/router';
import { routes } from '../../app.routes';
import { ViewSolicitationComponent } from './view-solicitation.component';

describe('ViewSolicitationComponent', () => {
	let component: ViewSolicitationComponent;
	let fixture: ComponentFixture<ViewSolicitationComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [ViewSolicitationComponent],
			providers: [
				provideRouter(routes),
				provideHttpClient(),
				provideAnimationsAsync(),
			],
		}).compileComponents();

		fixture = TestBed.createComponent(ViewSolicitationComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
