import { TestBed } from '@angular/core/testing';

import { ActionService } from './action.service';
import { provideHttpClient } from '@angular/common/http';

describe('ActionService', () => {
  let service: ActionService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient()]
    });
    service = TestBed.inject(ActionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
