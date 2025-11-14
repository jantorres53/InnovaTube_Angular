import { Component, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MaterialModule } from '../../material.module';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, MaterialModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit, AfterViewInit {
  @ViewChild('recaptchaElem') recaptchaElem?: ElementRef<HTMLDivElement>;
  private recaptchaWidgetId: number | null = null;
  form = this.fb.group({
    firstName: ['', [Validators.required]],
    lastName: ['', [Validators.required]],
    username: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', [Validators.required]],
  });
  loading = false;
  error: string | null = null;
  recaptchaToken = '';
  recaptchaError: string | null = null;
  recaptchaSiteKey = environment.recaptchaSiteKey;
  hidePassword = true;
  hideConfirm = true;
  strengthScore = 0;
  strengthLabel = '';
  strengthColor: 'warn' | 'accent' | 'primary' = 'warn';

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {}

  ngOnInit(): void {
    (window as any).onRecaptchaRegister = (token: string) => {
      this.recaptchaToken = token;
      this.recaptchaError = null;
    };

    this.form.controls.password.valueChanges.subscribe((v) => {
      const pwd = v || '';
      const lenScore = Math.min(pwd.length, 12) / 12 * 50;
      const variety = [/[a-z]/, /[A-Z]/, /\d/, /[^\w\s]/].reduce((acc, r) => acc + (r.test(pwd) ? 1 : 0), 0);
      const varScore = (variety / 4) * 50;
      this.strengthScore = Math.round(lenScore + varScore);
      if (this.strengthScore < 40) { this.strengthLabel = 'Débil'; this.strengthColor = 'warn'; }
      else if (this.strengthScore < 70) { this.strengthLabel = 'Media'; this.strengthColor = 'accent'; }
      else { this.strengthLabel = 'Fuerte'; this.strengthColor = 'primary'; }
    });
  }

  ngAfterViewInit(): void {
    if (this.recaptchaSiteKey && (window as any).grecaptcha && this.recaptchaElem?.nativeElement) {
      try {
        this.recaptchaWidgetId = (window as any).grecaptcha.render(this.recaptchaElem.nativeElement, {
          sitekey: this.recaptchaSiteKey,
          callback: (token: string) => (window as any).onRecaptchaRegister(token),
        });
      } catch {}
    }
  }

  passwordsMatch(): boolean {
    return (this.form.value.password || '') === (this.form.value.confirmPassword || '');
  }

  get f() { return this.form.controls; }

  async submit(): Promise<void> {
    if (this.form.invalid) return;
    if (!this.passwordsMatch()) {
      this.error = 'Las contraseñas no coinciden';
      return;
    }
    if (!this.recaptchaSiteKey) {
      this.recaptchaToken = '';
    }
    if (!this.recaptchaToken && this.recaptchaSiteKey) {
      this.recaptchaError = 'Completa el reCAPTCHA';
      return;
    }
    this.loading = true;
    this.error = null;
    try {
      const res = await this.auth.register({
        firstName: this.form.value.firstName || '',
        lastName: this.form.value.lastName || '',
        username: this.form.value.username || '',
        email: this.form.value.email || '',
        password: this.form.value.password || '',
        confirmPassword: this.form.value.confirmPassword || '',
        recaptchaToken: this.recaptchaToken,
      });
      if (res.success) {
        await new Promise((r) => setTimeout(r, 200));
        this.router.navigate(['/dashboard']);
      } else {
        this.error = res.message || 'Error de registro';
      }
    } catch (e: any) {
      this.error = e?.error?.message || 'Error de registro';
    } finally {
      this.loading = false;
      if ((window as any).grecaptcha && this.recaptchaWidgetId !== null) {
        try {
          (window as any).grecaptcha.reset(this.recaptchaWidgetId);
        } catch {}
      }
    }
  }
}