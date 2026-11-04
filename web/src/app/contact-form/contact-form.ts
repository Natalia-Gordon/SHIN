import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ContentService } from '../content/content.service';

type SendState = 'idle' | 'sending' | 'sent' | 'error';

/** Sends messages to /api/contact, which emails them through Gmail SMTP (see server/server.mjs). */
@Component({
  selector: 'app-contact-form',
  imports: [ReactiveFormsModule],
  templateUrl: './contact-form.html',
  styleUrl: './contact-form.scss',
})
export class ContactForm {
  private readonly config = toSignal(inject(ContentService).config$, { initialValue: null });

  protected readonly enabled = computed(() => this.config()?.contactFormEnabled === true);
  protected readonly state = signal<SendState>('idle');
  protected readonly errorMessage = signal('');
  protected readonly submitted = signal(false);

  protected readonly form = inject(FormBuilder).nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(120)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(200)]],
    message: ['', [Validators.required, Validators.maxLength(5000)]],
    // Honeypot: hidden from people, filled in by spam bots
    website: [''],
  });

  protected invalid(control: 'name' | 'email' | 'message'): boolean {
    const field = this.form.controls[control];
    return field.invalid && (field.touched || this.submitted());
  }

  protected async submit(): Promise<void> {
    if (!this.enabled() || this.state() === 'sending') return;
    this.submitted.set(true);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.state.set('sending');
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(this.form.getRawValue()),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error || 'Your message could not be sent. Please try again later.');
      }
      this.state.set('sent');
      this.form.reset();
      this.submitted.set(false);
    } catch (error) {
      this.errorMessage.set(
        error instanceof Error && error.message !== 'Failed to fetch'
          ? error.message
          : 'Your message could not be sent. Please try again later.',
      );
      this.state.set('error');
    }
  }

  protected writeAnother(): void {
    this.state.set('idle');
  }
}
