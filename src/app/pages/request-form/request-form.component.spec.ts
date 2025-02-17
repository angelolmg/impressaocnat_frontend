import { ComponentFixture, TestBed } from '@angular/core/testing';

import { provideHttpClient } from '@angular/common/http';
import { RequestFormComponent } from './request-form.component';
import { provideRouter } from '@angular/router';
import { routes } from '../../app.routes';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

describe('RequestFormComponent', () => {
	let component: RequestFormComponent;
	let fixture: ComponentFixture<RequestFormComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [RequestFormComponent],
			providers: [
				provideHttpClient(),
				provideRouter(routes),
				provideAnimationsAsync(),
			],
		}).compileComponents();

		fixture = TestBed.createComponent(RequestFormComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
