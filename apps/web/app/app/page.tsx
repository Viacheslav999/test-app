'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { io } from 'socket.io-client';

import { apiFetch, clearToken, getToken, SOCKET_URL } from '@/lib/api';
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
  const [copied, setCopied] = useState<string | null>(null);

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

  // ✅ realtime: при любом событии с любого вишлиста — обновляем список
  useEffect(() => {
    if (!items.length) return;

    const socket = io(SOCKET_URL, {
      path: '/socket.io',
      transports: ['polling', 'websocket'],
      withCredentials: false,
    });

    socket.on('connect', () => {
      // джойнимся во все комнаты, которые есть у пользователя
      for (const w of items) socket.emit('join_wishlist', { wishlist_id: w.id });
    });

    const onAnyUpdate = () => {
      // просто рефетчим, чтобы не городить сложный merge в список
      load();
    };

    socket.on('reservation_changed', onAnyUpdate);
    socket.on('funding_progress', onAnyUpdate);

    return () => {
      try {
        for (const w of items) socket.emit('leave_wishlist', { wishlist_id: w.id });
      } catch {}
      socket.off('reservation_changed', onAnyUpdate);
      socket.off('funding_progress', onAnyUpdate);
      socket.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.map((x) => x.id).join(',')]);

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

  async function copyPublicLink(slug: string) {
    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const full = `${origin}/w/${slug}`;
      await navigator.clipboard.writeText(full);
      setCopied(slug);
      setTimeout(() => setCopied(null), 1200);
    } catch {
      alert('Не удалось скопировать ссылку');
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
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Например: День рождения" />
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

                  <div style={{ marginTop: 6, color: '#64748b', fontSize: 13, wordBreak: 'break-all' }}>
                    Публичная ссылка:{' '}
                    <Link href={`/w/${w.public_slug}`}>/w/{w.public_slug}</Link>
                  </div>

                  <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <Button variant="ghost" onClick={() => copyPublicLink(w.public_slug)}>
                      {copied === w.public_slug ? 'Скопировано!' : 'Скопировать ссылку'}
                    </Button>
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
