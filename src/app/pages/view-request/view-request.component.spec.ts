import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewRequestComponent } from './view-request.component';

describe('ViewRequestComponent', () => {
  let component: ViewRequestComponent;
  let fixture: ComponentFixture<ViewRequestComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ViewRequestComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ViewRequestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
