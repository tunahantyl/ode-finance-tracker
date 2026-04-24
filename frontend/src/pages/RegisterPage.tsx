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
  fullName: z.string().min(2, 'Adın en az 2 karakter olmalı.'),
  email: z.string().email('Geçerli bir e-posta giriniz.'),
  password: z.string().min(6, 'Şifre en az 6 karakter olmalı.'),
});
type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const { register: doRegister } = useAuth();
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
      await doRegister(data.email, data.password, data.fullName);
      toast.success('Hesabın oluşturuldu.');
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
      <h2 className="text-2xl font-semibold text-ink">Hesap Oluştur</h2>
      <p className="mt-1 text-sm text-muted">Bütçeni saniyeler içinde takip etmeye başla.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4">
        <Input
          label="Ad Soyad"
          autoComplete="name"
          placeholder="Adınız Soyadınız"
          {...register('fullName')}
          error={errors.fullName?.message}
        />
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
          autoComplete="new-password"
          placeholder="En az 6 karakter"
          {...register('password')}
          error={errors.password?.message}
        />
        <Button type="submit" loading={submitting} className="w-full">
          Hesap Oluştur
        </Button>
      </form>

      <p className="mt-6 text-sm text-muted text-center">
        Zaten hesabın var mı?{' '}
        <Link to="/login" className="font-medium text-ink hover:underline">
          Giriş yap
        </Link>
      </p>
    </div>
  );
}
