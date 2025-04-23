import { ComponentFixture, TestBed } from '@angular/core/testing';

import { provideHttpClient } from '@angular/common/http';
import { SolicitationFormComponent } from './solicitation-form.component';
import { provideRouter } from '@angular/router';
import { routes } from '../../app.routes';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

describe('SolicitationFormComponent', () => {
	let component: SolicitationFormComponent;
	let fixture: ComponentFixture<SolicitationFormComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [SolicitationFormComponent],
			providers: [
				provideHttpClient(),
				provideRouter(routes),
				provideAnimationsAsync(),
			],
		}).compileComponents();

		fixture = TestBed.createComponent(SolicitationFormComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
