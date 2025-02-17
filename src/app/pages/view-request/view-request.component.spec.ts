import { ComponentFixture, TestBed } from '@angular/core/testing';

import { provideHttpClient } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter } from '@angular/router';
import { routes } from '../../app.routes';
import { ViewRequestComponent } from './view-request.component';

describe('ViewRequestComponent', () => {
	let component: ViewRequestComponent;
	let fixture: ComponentFixture<ViewRequestComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [ViewRequestComponent],
			providers: [
				provideRouter(routes),
				provideHttpClient(),
				provideAnimationsAsync(),
			],
		}).compileComponents();

		fixture = TestBed.createComponent(ViewRequestComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
