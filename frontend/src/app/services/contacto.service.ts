import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Contacto } from '../models/contacto'

@Injectable({ providedIn: 'root' })
export class ContactoService {
  private apiUrl = 'http://localhost:3000/contactos';
  private uploadUrl = 'http://localhost:3000/upload';
  private imageBaseUrl = 'http://localhost:3000/uploads';

  constructor(private http: HttpClient) {}

  getAll(): Observable<Contacto[]> {
    return this.http.get<Contacto[]>(this.apiUrl);
  }

  create(c: Contacto): Observable<Contacto> {
    return this.http.post<Contacto>(this.apiUrl, c);
  }

  update(id: number, c: Contacto): Observable<Contacto> {
    return this.http.put<Contacto>(`${this.apiUrl}/${id}`, c);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  uploadImage(file: File): Observable<{ fileName: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ fileName: string }>(this.uploadUrl, formData);
  }

  getImageUrl(fileName: string): string {
    return `${this.imageBaseUrl}/${fileName}`;
  }
}