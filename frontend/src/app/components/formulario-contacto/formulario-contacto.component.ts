import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ContactoService } from '../../services/contacto.service';
import { Contacto } from '../../models/contacto';

@Component({
  selector: 'app-formulario-contacto',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './formulario-contacto.component.html'
})
export class FormularioContactoComponent implements OnInit, OnChanges {

  @Input() contacto: Contacto | null = null;
  @Output() guardado = new EventEmitter<void>();

  form: Contacto = { nombre: '', telefono: '', notas: '', foto: '' };

  previewImage: string | null = null;
  uploading = false;
  errores: { [key: string]: string } = {};

  constructor(private contactoService: ContactoService) {}

  ngOnInit() {
    if (this.contacto) {
      this.form = { ...this.contacto };
      if (this.contacto.foto) {
        this.previewImage = this.contactoService.getImageUrl(this.contacto.foto);
      }
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['contacto'] && this.contacto) {
      this.form = { ...this.contacto };
      if (this.contacto.foto) {
        this.previewImage = this.contactoService.getImageUrl(this.contacto.foto);
      }
    }
  }

  validar(): boolean {
    this.errores = {};

    if (!this.form.nombre || this.form.nombre.trim() === '') {
      this.errores['nombre'] = 'El nombre es obligatorio';
    } else if (this.form.nombre.trim().length < 2) {
      this.errores['nombre'] = 'El nombre debe tener al menos 2 caracteres';
    } else if (this.form.nombre.trim().length > 50) {
      this.errores['nombre'] = 'El nombre no puede tener más de 50 caracteres';
    }

    if (!this.form.telefono || this.form.telefono.trim() === '') {
      this.errores['telefono'] = 'El teléfono es obligatorio';
    } else if (!/^\d+$/.test(this.form.telefono.trim())) {
      this.errores['telefono'] = 'El teléfono solo puede contener números';
    } else if (this.form.telefono.trim().length < 9) {
      this.errores['telefono'] = 'El teléfono debe tener al menos 9 dígitos';
    } else if (this.form.telefono.trim().length > 15) {
      this.errores['telefono'] = 'El teléfono no puede tener más de 15 dígitos';
    }

    if (this.form.notas && this.form.notas.length > 200) {
      this.errores['notas'] = 'Las notas no pueden tener más de 200 caracteres';
    }

    return Object.keys(this.errores).length === 0;
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 2_000_000) {
      alert('La imagen es demasiado grande (máx 2MB)');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      this.previewImage = reader.result as string;
    };
    reader.readAsDataURL(file);

    this.uploading = true;
    this.contactoService.uploadImage(file).subscribe(
      (response) => {
        this.form.foto = response.fileName;
        this.uploading = false;
      },
      (error) => {
        console.error('Error al subir imagen:', error);
        this.uploading = false;
        alert('Error al subir la imagen');
      }
    );
  }

  guardar() {
    if (!this.validar()) return;

    if (this.uploading) {
      alert('Espera a que la imagen termine de subirse');
      return;
    }

    if (this.form.id) {
      this.contactoService.update(this.form.id, this.form)
        .subscribe(() => this.guardado.emit());
    } else {
      this.contactoService.create(this.form)
        .subscribe(() => this.guardado.emit());
    }
  }

  cancelar() {
    this.errores = {};
    this.guardado.emit();
  }
}