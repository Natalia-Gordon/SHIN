import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-contact-form',
  imports: [FormsModule],
  templateUrl: './contact-form.html',
  styleUrl: './contact-form.scss',
})
export class ContactForm {
  protected name = '';
  protected email = '';
  protected message = '';
  protected readonly sent = signal(false);

  protected send(): void {
    const subject = encodeURIComponent('Message to SHIN');
    const body = encodeURIComponent(`Name: ${this.name}\nEmail: ${this.email}\n\n${this.message}`);
    this.sent.set(true);
    window.location.href = `mailto:michal@shin.org.il?subject=${subject}&body=${body}`;
  }
}
