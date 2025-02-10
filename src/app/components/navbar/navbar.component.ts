import { Component, EventEmitter, inject, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ActionService } from '../../service/action.service';

@Component({
  selector: 'app-navbar',
  imports: [MatIconModule, MatButtonModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent {
  actionService = inject(ActionService);

  toggleDrawer() {
    this.actionService.toggleSideMenuUI.emit();
  }
}
