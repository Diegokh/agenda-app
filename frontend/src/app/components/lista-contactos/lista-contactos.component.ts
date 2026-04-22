import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ContactoService } from '../../services/contacto.service';
import { Contacto } from '../../models/contacto';
import { FormularioContactoComponent } from '../formulario-contacto/formulario-contacto.component';

@Component({
  selector: 'app-lista-contactos',
  standalone: true,
  imports: [CommonModule, FormularioContactoComponent, FormsModule],
  templateUrl: './lista-contactos.component.html'
})
export class ListaContactosComponent implements OnInit {
  contactos: Contacto[] = [];
  contactoSeleccionado: Contacto | null = null;
  mostrarFormulario = false;
  busqueda = '';

  constructor(private contactoService: ContactoService) {}

  ngOnInit() { this.cargar(); }

  cargar() {
    this.contactoService.getAll().subscribe(data => this.contactos = data);
  }

  get contactosFiltrados(): Contacto[] {
    if (!this.busqueda.trim()) return this.contactos;
    return this.contactos.filter(c =>
      c.nombre.toLowerCase().includes(this.busqueda.toLowerCase())
    );
  }

  nuevo() {
    this.contactoSeleccionado = null;
    this.mostrarFormulario = true;
  }

  editar(c: Contacto) {
    this.contactoSeleccionado = c;
    this.mostrarFormulario = true;
  }

  eliminar(id: number) {
    if (confirm('¿Eliminar contacto?')) {
      this.contactoService.delete(id).subscribe(() => this.cargar());
    }
  }

  getImageUrl(fileName: string): string {
    return this.contactoService.getImageUrl(fileName);
  }

  alGuardar() {
    this.mostrarFormulario = false;
    this.cargar();
  }
}