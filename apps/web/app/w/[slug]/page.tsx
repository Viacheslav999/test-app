"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { io } from "socket.io-client";

import { apiFetch, WS_URL, getGuestToken } from "@/lib/api";
import { Card, Button, Input, Badge } from "@/components/ui";
import { Progress } from "@/components/progress";

type Item = {
  id: number;
  title: string;
  url: string;
  image_url?: string | null;
  price?: number | null;
  allow_funding: boolean;
  reserved: boolean;
  funded_amount: number;
};

type PublicWishlist = { id: number; title: string; items: Item[] };

export default function PublicWishlistPage() {
  const router = useRouter();
  const params = useParams();
  const slug = String(params.slug);

  const [data, setData] = useState<PublicWishlist | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const [fundAmount, setFundAmount] = useState<Record<number, string>>({});
  const [busy, setBusy] = useState<Record<string, boolean>>({});

  const guestKey = useMemo(() => `wishlist:${slug}`, [slug]);
  const guestToken = useMemo(() => getGuestToken(guestKey), [guestKey]);

  function goHome() {
    if (typeof window !== "undefined" && window.history.length > 1) router.back();
    else window.location.href = "/";
  }

  async function load() {
    setErr(null);
    try {
      const w = await apiFetch<PublicWishlist>(`/wishlists/public/${slug}`, { headers: {} });
      setData(w);
    } catch (e: any) {
      setErr(e.message || "Ошибка загрузки");
    }
  }

  useEffect(() => {
    load();
  }, [slug]);

  // realtime updates
  useEffect(() => {
    if (!data) return;

    const socket = io(WS_URL, { transports: ["websocket"] });

    socket.on("connect", () => {
      socket.emit("join_wishlist", { wishlist_id: data.id });
    });

    socket.on("reservation_changed", (payload: { item_id: number; reserved: boolean }) => {
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          items: prev.items.map((it) => (it.id === payload.item_id ? { ...it, reserved: payload.reserved } : it)),
        };
      });
    });

    socket.on("funding_progress", (payload: { item_id: number; funded_amount: number }) => {
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          items: prev.items.map((it) => (it.id === payload.item_id ? { ...it, funded_amount: payload.funded_amount } : it)),
        };
      });
    });

    return () => {
      try {
        socket.emit("leave_wishlist", { wishlist_id: data.id });
      } catch {}
      socket.disconnect();
    };
  }, [data?.id]);

  async function reserve(itemId: number) {
    const key = `reserve:${itemId}`;
    setBusy((b) => ({ ...b, [key]: true }));
    try {
      await apiFetch(`/public/reserve`, {
        method: "POST",
        body: JSON.stringify({ slug, item_id: itemId, guest_token: guestToken }),
        headers: {},
      });
    } catch (e: any) {
      alert(e.message || "Не удалось забронировать");
    } finally {
      setBusy((b) => ({ ...b, [key]: false }));
    }
  }

  async function unreserve(itemId: number) {
    const key = `unreserve:${itemId}`;
    setBusy((b) => ({ ...b, [key]: true }));
    try {
      await apiFetch(`/public/unreserve`, {
        method: "POST",
        body: JSON.stringify({ slug, item_id: itemId, guest_token: guestToken }),
        headers: {},
      });
    } catch (e: any) {
      alert(e.message || "Не удалось снять бронь");
    } finally {
      setBusy((b) => ({ ...b, [key]: false }));
    }
  }

  async function contribute(itemId: number) {
    const key = `contrib:${itemId}`;
    setBusy((b) => ({ ...b, [key]: true }));
    try {
      const amount = Number(fundAmount[itemId] || "0");
      await apiFetch(`/public/contribute`, {
        method: "POST",
        body: JSON.stringify({ slug, item_id: itemId, amount, currency: "EUR", guest_token: guestToken }),
        headers: {},
      });
      setFundAmount((m) => ({ ...m, [itemId]: "" }));
    } catch (e: any) {
      alert(e.message || "Не удалось внести вклад");
    } finally {
      setBusy((b) => ({ ...b, [key]: false }));
    }
  }

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ margin: 0 }}>{data?.title || "Wishlist"}</h1>
          <div style={{ marginTop: 6, opacity: 0.7, fontSize: 13 }}>
            Публичная страница — регистрация не нужна. Бронь и прогресс обновляются в реальном времени.
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Button variant="ghost" onClick={goHome}>Назад</Button>
          <Link href="/register"><Button variant="primary">Создать свой</Button></Link>
        </div>
      </div>

      {err && <Card><div style={{ color: "#fecaca" }}>{err}</div></Card>}

      {!data ? (
        <Card><div style={{ opacity: 0.75 }}>Загружаем…</div></Card>
      ) : data.items.length === 0 ? (
        <Card>
          <div style={{ textAlign: "center", padding: 10 }}>
            <div style={{ fontWeight: 700, fontSize: 16 }}>Пока нет подарков</div>
            <div style={{ marginTop: 6, opacity: 0.75, fontSize: 13 }}>Владелец ещё ничего не добавил. Вернись позже.</div>
          </div>
        </Card>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {data.items.map((it) => {
            const target = it.price || 0;
            const funded = it.funded_amount || 0;
            const pct = target > 0 ? Math.min(100, Math.round((funded / target) * 100)) : 0;

            return (
              <Card key={it.id}>
                <div style={{ display: "flex", gap: 14, alignItems: "flex-start", flexWrap: "wrap" }}>
                  <div style={{ width: 84, height: 84, borderRadius: 14, overflow: "hidden", flex: "0 0 auto", border: "1px solid rgba(255,255,255,.12)" }}>
                    {it.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={it.image_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <div style={{ width: "100%", height: "100%", background: "rgba(255,255,255,.06)" }} />
                    )}
                  </div>

                  <div style={{ flex: 1, minWidth: 240 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                      <div style={{ fontWeight: 750, fontSize: 16 }}>{it.title}</div>
                      {it.reserved ? <Badge>Зарезервировано</Badge> : <Badge>Свободно</Badge>}
                    </div>

                    <div style={{ marginTop: 6, opacity: 0.7, fontSize: 13, wordBreak: "break-word" }}>
                      <a href={it.url} target="_blank" rel="noreferrer">{it.url}</a>
                    </div>

                    {it.price != null && (
                      <div style={{ marginTop: 8, opacity: 0.85, fontSize: 13 }}>
                        Цель: <b>€{it.price.toFixed(2)}</b>
                      </div>
                    )}

                    <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <a href={it.url} target="_blank" rel="noreferrer">
                        <Button variant="ghost">Открыть товар</Button>
                      </a>

                      {!it.reserved ? (
                        <Button
                          variant="primary"
                          onClick={() => reserve(it.id)}
                          disabled={busy[`reserve:${it.id}`]}
                        >
                          Зарезервировать
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          onClick={() => unreserve(it.id)}
                          disabled={busy[`unreserve:${it.id}`]}
                        >
                          Снять бронь (если это ты)
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {it.allow_funding && (
                  <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                      <div style={{ fontWeight: 650 }}>Скидываемся</div>
                      {it.price != null && (
                        <div style={{ opacity: 0.7, fontSize: 13 }}>
                          Собрано <b>€{funded.toFixed(2)}</b> из <b>€{it.price.toFixed(2)}</b> ({pct}%)
                        </div>
                      )}
                    </div>

                    <Progress value={pct} />

                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                      <div style={{ flex: 1, minWidth: 220 }}>
                        <Input
                          value={fundAmount[it.id] || ""}
                          onChange={(e) => setFundAmount((m) => ({ ...m, [it.id]: e.target.value }))}
                          placeholder="Сумма (например 10)"
                        />
                      </div>

                      <Button
                        variant="primary"
                        onClick={() => contribute(it.id)}
                        disabled={busy[`contrib:${it.id}`] || Number(fundAmount[it.id] || "0") <= 0}
                      >
                        Внести
                      </Button>
                    </div>

                    <div style={{ opacity: 0.65, fontSize: 12 }}>
                      Владелец списка не видит, кто сколько внёс.
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
