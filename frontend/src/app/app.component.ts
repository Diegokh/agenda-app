import { Component } from '@angular/core';
import { ListaContactosComponent } from './components/lista-contactos/lista-contactos.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ListaContactosComponent], 
  templateUrl: './app.component.html'
})
export class AppComponent {}