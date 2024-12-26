import { Component } from '@angular/core';

interface Option {
  image: string
  text: string
}

interface User {
  id: string
  name: string
}

@Component({
  selector: 'app-side-menu',
  imports: [],
  templateUrl: './side-menu.component.html',
  styleUrl: './side-menu.component.scss'
})
export class SideMenuComponent {

  user: User = {
    'id': '123456',
    'name': 'Fulano de Tal'
  }

  options: Option[] = [
    {
      'image': 'assets/upload-02.svg',
      'text': 'Nova Solicitação'
    },
    {
      'image': 'assets/listing-02.svg',
      'text': 'Minhas Solicitações'
    },
    {
      'image': 'assets/listing-02.svg',
      'text': 'Todas as Solicitações'
    }
  ]
}
