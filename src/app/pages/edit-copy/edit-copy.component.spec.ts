import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditCopyComponent } from './edit-copy.component';

describe('EditCopyComponent', () => {
  let component: EditCopyComponent;
  let fixture: ComponentFixture<EditCopyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditCopyComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditCopyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
