import { TestBed } from '@angular/core/testing';

import { RequestService } from './request.service';
import { provideHttpClient } from '@angular/common/http';

describe('RequestService', () => {
	let service: RequestService;

	beforeEach(() => {
		TestBed.configureTestingModule({
      providers: [provideHttpClient()]
    });
		service = TestBed.inject(RequestService);
	});

	it('should be created', () => {
		expect(service).toBeTruthy();
	});
});
