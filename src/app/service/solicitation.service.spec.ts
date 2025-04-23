import { TestBed } from '@angular/core/testing';

import { SolicitationService } from './solicitation.service';
import { provideHttpClient } from '@angular/common/http';

describe('SolicitationService', () => {
	let service: SolicitationService;

	beforeEach(() => {
		TestBed.configureTestingModule({
      providers: [provideHttpClient()]
    });
		service = TestBed.inject(SolicitationService);
	});

	it('should be created', () => {
		expect(service).toBeTruthy();
	});
});
