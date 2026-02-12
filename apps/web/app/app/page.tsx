'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch, clearToken, getToken } from '@/lib/api';
import { Card, Button, Input, Badge } from '@/components/ui';

type Wishlist = {
  id: number;
  title: string;
  public_slug: string;
};

export default function AppHome() {
  const [items, setItems] = useState<Wishlist[]>([]);
  const [title, setTitle] = useState('');
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    const token = getToken();
    if (!token) {
      window.location.href = '/login';
      return;
    }

    try {
      const res = await apiFetch<Wishlist[]>('/wishlists');
      setItems(res);
    } catch (e: any) {
      setErr(e.message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function createWishlist() {
    setErr(null);
    try {
      const w = await apiFetch<Wishlist>('/wishlists', {
        method: 'POST',
        body: JSON.stringify({ title }),
      });
      setTitle('');
      setItems([w, ...items]);
    } catch (e: any) {
      setErr(e.message);
    }
  }

  return (
    <div style={{ display: 'grid', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <h1 style={{ margin: 0 }}>Мои вишлисты</h1>
          <div style={{ marginTop: 6, color: '#64748b', fontSize: 13 }}>
            Создавай списки, делись ссылкой, друзья бронируют и скидываются.
          </div>
        </div>

        <Button
          variant="ghost"
          onClick={() => {
            clearToken();
            window.location.href = '/';
          }}
        >
          Выйти
        </Button>
      </div>

      <Card>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Badge>Новый список</Badge>
            <div style={{ color: '#64748b', fontSize: 13 }}>ДР, Новый год, “хочу купить”, что угодно.</div>
          </div>
        </div>

        <div style={{ height: 10 }} />

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 240 }}>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Например: День рождения"
            />
          </div>
          <Button variant="primary" onClick={createWishlist} disabled={!title.trim()}>
            Создать
          </Button>
        </div>

        {err && (
          <div style={{ marginTop: 10, color: '#b91c1c', fontSize: 13 }}>
            {err}
          </div>
        )}
      </Card>

      {items.length === 0 ? (
        <Card>
          <div style={{ textAlign: 'center', padding: 10 }}>
            <div style={{ fontWeight: 700, fontSize: 16 }}>Пока пусто</div>
            <div style={{ marginTop: 6, color: '#64748b', fontSize: 13 }}>
              Создай первый вишлист и отправь публичную ссылку друзьям — без регистрации.
            </div>
          </div>
        </Card>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {items.map((w) => (
            <Card key={w.id}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap' }}>
                <div style={{ minWidth: 240 }}>
                  <div style={{ fontWeight: 700, fontSize: 16 }}>{w.title}</div>
                  <div style={{ marginTop: 6, color: '#64748b', fontSize: 13 }}>
                    Публичная ссылка:{' '}
                    <Link href={`/w/${w.public_slug}`}>/w/{w.public_slug}</Link>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <Link href={`/app/w/${w.id}`}>
                    <Button>Открыть</Button>
                  </Link>
                  <Link href={`/w/${w.public_slug}`}>
                    <Button variant="primary">Публично</Button>
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
