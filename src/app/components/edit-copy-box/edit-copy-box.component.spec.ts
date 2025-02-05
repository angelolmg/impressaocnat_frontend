import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditCopyBoxComponent } from './edit-copy-box.component';

describe('EditCopyBoxComponent', () => {
  let component: EditCopyBoxComponent;
  let fixture: ComponentFixture<EditCopyBoxComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditCopyBoxComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditCopyBoxComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
