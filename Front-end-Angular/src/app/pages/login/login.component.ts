import { Component, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MaterialModule } from '../../material.module';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, MaterialModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit, AfterViewInit {
  @ViewChild('recaptchaElem') recaptchaElem?: ElementRef<HTMLDivElement>;
  private recaptchaWidgetId: number | null = null;
  form = this.fb.group({
    login: ['', [Validators.required]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });
  loading = false;
  error: string | null = null;
  recaptchaToken = '';
  recaptchaError: string | null = null;
  recaptchaSiteKey = environment.recaptchaSiteKey;
  illustrationSrc = 'assets/music_online_2.jpg';
  hidePassword = true;

  retryRecaptcha(): void {
    try {
      (window as any).grecaptcha?.reset(this.recaptchaWidgetId ?? undefined);
      this.recaptchaError = null;
    } catch {}
  }

  get f() { return this.form.controls; }

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {}

  ngOnInit(): void {
    (window as any).onRecaptchaLogin = (token: string) => {
      this.recaptchaToken = token;
      this.recaptchaError = null;
    };
    const token = localStorage.getItem('token');
    if (token) this.router.navigate(['/dashboard']);
  }

  ngAfterViewInit(): void {
    const g = (window as any).grecaptcha;
    if (this.recaptchaSiteKey && this.recaptchaElem?.nativeElement) {
      if (g?.ready) {
        try {
          g.ready(() => {
            this.recaptchaWidgetId = g.render(this.recaptchaElem!.nativeElement, {
              sitekey: this.recaptchaSiteKey,
              size: (window.innerWidth <= 480) ? 'compact' : 'normal',
              callback: (token: string) => (window as any).onRecaptchaLogin(token),
            });
          });
        } catch {}
      } else if (g?.render) {
        try {
          this.recaptchaWidgetId = g.render(this.recaptchaElem.nativeElement, {
            sitekey: this.recaptchaSiteKey,
            size: (window.innerWidth <= 480) ? 'compact' : 'normal',
            callback: (token: string) => (window as any).onRecaptchaLogin(token),
          });
        } catch {}
      } else {
        const tryLoad = () => {
          const gr = (window as any).grecaptcha;
          if (gr?.render && this.recaptchaElem?.nativeElement) {
            try {
              this.recaptchaWidgetId = gr.render(this.recaptchaElem.nativeElement, {
                sitekey: this.recaptchaSiteKey,
                size: (window.innerWidth <= 480) ? 'compact' : 'normal',
                callback: (token: string) => (window as any).onRecaptchaLogin(token),
              });
            } catch {}
          } else {
            setTimeout(tryLoad, 300);
          }
        };
        tryLoad();
      }
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
    this.error = null;
    try {
      const res = await this.auth.login({
        login: this.form.value.login || '',
        password: this.form.value.password || '',
        recaptchaToken: this.recaptchaToken,
      });
      if (res.success) {
        await new Promise((r) => setTimeout(r, 200));
        this.router.navigate(['/dashboard']);
      } else {
        this.error = res.message || 'Usuario o contraseña incorrectos';
      }
    } catch (e: any) {
      this.error = e?.error?.message || 'Usuario o contraseña incorrectos';
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