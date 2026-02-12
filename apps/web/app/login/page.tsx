'use client';

import { useState } from 'react';
import Link from 'next/link';
import { apiFetch, setToken } from '@/lib/api';
import { Card, Button, Input, Label } from '@/components/ui';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const res = await apiFetch<{ access_token: string }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      setToken(res.access_token);
      window.location.href = '/app';
    } catch (e: any) {
      setErr(e.message || 'Ошибка');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className='space-y-4'>
      <h1 className='text-2xl font-semibold'>Войти</h1>
      <Card className='p-5 space-y-4'>
        <form className='space-y-3' onSubmit={onSubmit}>
          <div className='space-y-1'>
            <Label>Email</Label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder='you@example.com' required />
          </div>
          <div className='space-y-1'>
            <Label>Пароль</Label>
            <Input type='password' value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          {err && <div className='text-sm text-red-600'>{err}</div>}
          <Button disabled={loading} className='bg-gray-900 text-white border-gray-900 hover:bg-gray-800 w-full'>
            {loading ? 'Входим…' : 'Войти'}
          </Button>
        </form>
        <div className='text-sm text-gray-600'>
          Нет аккаунта? <Link href='/register'>Регистрация</Link>
        </div>
      </Card>
    </div>
  );
}
