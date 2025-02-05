import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddCopyBoxComponent } from './add-copy-box.component';

describe('AddCopyBoxComponent', () => {
  let component: AddCopyBoxComponent;
  let fixture: ComponentFixture<AddCopyBoxComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddCopyBoxComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddCopyBoxComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
