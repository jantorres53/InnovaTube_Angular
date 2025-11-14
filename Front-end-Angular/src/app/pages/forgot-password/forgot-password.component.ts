import { Component, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MaterialModule } from '../../material.module';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MaterialModule],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.css']
})
export class ForgotPasswordComponent implements OnInit, AfterViewInit {
  @ViewChild('recaptchaElem') recaptchaElem?: ElementRef<HTMLDivElement>;
  private recaptchaWidgetId: number | null = null;
  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });
  loading = false;
  status: string | null = null;
  recaptchaToken = '';
  recaptchaError: string | null = null;
  recaptchaSiteKey = environment.recaptchaSiteKey;

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {}

  ngOnInit(): void {
    (window as any).onRecaptchaForgot = (token: string) => {
      this.recaptchaToken = token;
      this.recaptchaError = null;
    };
  }

  ngAfterViewInit(): void {
    if (this.recaptchaSiteKey && (window as any).grecaptcha && this.recaptchaElem?.nativeElement) {
      try {
        this.recaptchaWidgetId = (window as any).grecaptcha.render(this.recaptchaElem.nativeElement, {
          sitekey: this.recaptchaSiteKey,
          callback: (token: string) => (window as any).onRecaptchaForgot(token),
        });
      } catch {}
    }
  }

  async submit(): Promise<void> {
    if (this.form.invalid) return;
    if (!this.recaptchaSiteKey) {
      this.recaptchaToken = '';
    }
    if (!this.recaptchaToken && this.recaptchaSiteKey) {
      this.recaptchaError = 'Completa el reCAPTCHA';
      return;
    }
    this.loading = true;
    try {
      const res = await this.auth.requestPasswordReset(this.form.value.email || '', this.recaptchaToken);
      this.status = res.message || (res.success ? 'Correo enviado' : 'Error');
      if (res.success) {
        try { localStorage.setItem('resetEmail', this.form.value.email || ''); } catch {}
        setTimeout(() => this.router.navigate(['/reset-password']), 500);
      }
    } catch (e: any) {
      this.status = e?.error?.message || 'Error';
    } finally {
      this.loading = false;
      if ((window as any).grecaptcha && this.recaptchaWidgetId !== null) {
        try { (window as any).grecaptcha.reset(); } catch {}
      }
    }
  }
}