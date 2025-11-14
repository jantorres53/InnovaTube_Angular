import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { MaterialModule } from '../../material.module';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MaterialModule],
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.css']
})
export class ResetPasswordComponent implements OnInit {
  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    code: ['', [Validators.required]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });
  loading = false;
  status: string | null = null;
  isVerified = false;
  maskedEmail: string = '';
  hidePassword = true;

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {}

  ngOnInit(): void {
    let saved = '';
    try { saved = localStorage.getItem('resetEmail') || ''; } catch {}
    if (saved) {
      this.form.controls.email.setValue(saved);
      this.maskedEmail = this.maskEmail(saved);
    }
  }

  private maskEmail(email: string): string {
    const parts = email.split('@');
    if (parts.length !== 2) return email;
    const local = parts[0];
    const domain = parts[1];
    const first = local.charAt(0) || '*';
    const maskedLocal = first + '*'.repeat(Math.max(local.length - 1, 5));
    const lastDot = domain.lastIndexOf('.');
    if (lastDot === -1) return maskedLocal + '@' + '*'.repeat(Math.max(domain.length, 5));
    const tld = domain.slice(lastDot + 1);
    const maskedDomain = '*'.repeat(Math.max(lastDot, 5));
    return `${maskedLocal}@${maskedDomain}.${tld}`;
  }

  async verify(): Promise<void> {
    if (!this.form.value.email || !this.form.value.code) return;
    this.loading = true;
    try {
      const res = await this.auth.verifyResetCode(this.form.value.email || '', this.form.value.code || '');
      this.isVerified = !!res.success;
      this.status = res.message || (res.success ? 'Código verificado' : 'Código inválido');
    } catch (e: any) {
      this.status = e?.error?.message || 'Error';
    } finally {
      this.loading = false;
    }
  }

  async submit(): Promise<void> {
    if (!this.isVerified) return;
    if (this.form.invalid) return;
    this.loading = true;
    try {
      const res = await this.auth.resetPassword(
        this.form.value.email || '',
        this.form.value.code || '',
        this.form.value.password || ''
      );
      this.status = res.message || (res.success ? 'Contraseña restablecida' : 'Error');
      if (res.success) {
        try { localStorage.removeItem('resetEmail'); } catch {}
        setTimeout(() => this.router.navigate(['/login']), 800);
      }
    } catch (e: any) {
      this.status = e?.error?.message || 'Error';
    } finally {
      this.loading = false;
    }
  }
}