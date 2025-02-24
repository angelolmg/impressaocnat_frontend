import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewCopyBoxComponent } from './new-copy-box.component';

describe('NewCopyBoxComponent', () => {
  let component: NewCopyBoxComponent;
  let fixture: ComponentFixture<NewCopyBoxComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NewCopyBoxComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NewCopyBoxComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
