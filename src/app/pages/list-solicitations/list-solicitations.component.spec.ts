import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListSolicitationsComponent } from './list-solicitations.component';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { routes } from '../../app.routes';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

describe('ListSolicitationsComponent', () => {
	let component: ListSolicitationsComponent;
	let fixture: ComponentFixture<ListSolicitationsComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [ListSolicitationsComponent],
			providers: [
				provideHttpClient(),
				provideRouter(routes),
				provideAnimationsAsync(),
			],
		}).compileComponents();

		fixture = TestBed.createComponent(ListSolicitationsComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
