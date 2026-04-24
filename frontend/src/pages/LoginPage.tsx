import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Input } from '@/ui/Input';
import { Button } from '@/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { extractApiError } from '@/lib/api';

const schema = z.object({
  email: z.string().email('Geçerli bir e-posta giriniz.'),
  password: z.string().min(1, 'Şifre gerekli.'),
});
type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    try {
      await login(data.email, data.password);
      toast.success('Hoş geldiniz.');
      nav('/');
    } catch (e) {
      const { message } = extractApiError(e);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold text-ink">Giriş Yap</h2>
      <p className="mt-1 text-sm text-muted">Hesabına giriş yaparak devam et.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4">
        <Input
          label="E-posta"
          type="email"
          autoComplete="email"
          placeholder="ornek@mail.com"
          {...register('email')}
          error={errors.email?.message}
        />
        <Input
          label="Şifre"
          type="password"
          autoComplete="current-password"
          placeholder="••••••"
          {...register('password')}
          error={errors.password?.message}
        />
        <Button type="submit" loading={submitting} className="w-full">
          Giriş Yap
        </Button>
      </form>

      <p className="mt-6 text-sm text-muted text-center">
        Hesabın yok mu?{' '}
        <Link to="/register" className="font-medium text-ink hover:underline">
          Kayıt ol
        </Link>
      </p>
    </div>
  );
}
