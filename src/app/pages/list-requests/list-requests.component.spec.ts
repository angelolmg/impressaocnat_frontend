import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListRequestsComponent } from './list-requests.component';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { routes } from '../../app.routes';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

describe('ListRequestsComponent', () => {
	let component: ListRequestsComponent;
	let fixture: ComponentFixture<ListRequestsComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [ListRequestsComponent],
			providers: [
				provideHttpClient(),
				provideRouter(routes),
				provideAnimationsAsync(),
			],
		}).compileComponents();

		fixture = TestBed.createComponent(ListRequestsComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
