"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

import { apiFetch } from "@/lib/api";
import { Card, Button, Input, Label, Badge } from "@/components/ui";

type Item = {
  id: number;
  title: string;
  url: string;
  image_url?: string | null;
  price?: number | null;
  allow_funding: boolean;
};

type Wishlist = {
  id: number;
  title: string;
  public_slug: string;
  items: Item[];
};

export default function AdminWishlistPage() {
  const router = useRouter();
  const params = useParams();
  const id = Number(params.id);

  const [data, setData] = useState<Wishlist | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  // add item
  const [itemUrl, setItemUrl] = useState("");
  const [itemTitle, setItemTitle] = useState("");
  const [itemPrice, setItemPrice] = useState("");
  const [itemImage, setItemImage] = useState("");
  const [allowFunding, setAllowFunding] = useState(true);
  const [busy, setBusy] = useState(false);

  const publicUrl = useMemo(() => {
    if (!data) return "";
    if (typeof window === "undefined") return `/w/${data.public_slug}`;
    return `${window.location.origin}/w/${data.public_slug}`;
  }, [data?.public_slug]);

  function goBack() {
    if (typeof window !== "undefined" && window.history.length > 1) router.back();
    else window.location.href = "/app";
  }

  async function load() {
    setErr(null);
    try {
      const w = await apiFetch<Wishlist>(`/wishlists/${id}`);
      setData(w);
    } catch (e: any) {
      setErr(e.message || "Ошибка загрузки");
    }
  }

  useEffect(() => {
    if (!Number.isFinite(id)) return;
    load();
  }, [id]);

  async function copyPublicLink() {
    if (!publicUrl) return;
    await navigator.clipboard.writeText(publicUrl);
    setInfo("Ссылка скопирована");
    setTimeout(() => setInfo(null), 1500);
  }

  // ✅ FIX: через /api (Next proxy), чтобы работало в проде
  async function autofillByUrl() {
    setInfo(null);
    setErr(null);
    if (!itemUrl.trim()) return;

    try {
      const q = encodeURIComponent(itemUrl.trim());
      const meta = await apiFetch<{ title?: string; image_url?: string; price?: number }>(`/meta?url=${q}`);

      if (meta?.title && !itemTitle) setItemTitle(meta.title);
      if (meta?.image_url && !itemImage) setItemImage(meta.image_url);
      if (typeof meta?.price === "number" && !itemPrice) setItemPrice(String(meta.price));

      setInfo("Автозаполнение выполнено");
      setTimeout(() => setInfo(null), 1500);
    } catch {
      setInfo("Не удалось автозаполнить — можно заполнить вручную");
      setTimeout(() => setInfo(null), 2000);
    }
  }

  async function addItem() {
    setBusy(true);
    setErr(null);
    setInfo(null);

    try {
      const payload = {
        title: itemTitle.trim() || itemUrl.trim(),
        url: itemUrl.trim(),
        price: itemPrice ? Number(itemPrice) : null,
        image_url: itemImage.trim() || null,
        allow_funding: allowFunding,
      };

      await apiFetch(`/wishlists/${id}/items`, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      setItemUrl("");
      setItemTitle("");
      setItemPrice("");
      setItemImage("");
      setAllowFunding(true);

      setInfo("Добавлено");
      setTimeout(() => setInfo(null), 1200);

      await load();
    } catch (e: any) {
      setErr(e.message || "Ошибка добавления");
    } finally {
      setBusy(false);
    }
  }

  async function deleteItem(itemId: number) {
    const ok = confirm("Удалить подарок из списка? (резервы/вклады сохранятся как история, если реализовано на бэке)");
    if (!ok) return;

    try {
      await apiFetch(`/wishlists/${id}/items/${itemId}`, { method: "DELETE" });
      await load();
    } catch (e: any) {
      alert(e.message || "Не удалось удалить");
    }
  }

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ margin: 0 }}>{data?.title || "Мой вишлист"}</h1>
          <div style={{ marginTop: 6, opacity: 0.7, fontSize: 13 }}>
            Владелец не видит, кто бронировал / кто сколько внёс — сюрприз сохраняется.
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Button variant="ghost" onClick={goBack}>Назад</Button>
          {data?.public_slug && (
            <Link href={`/w/${data.public_slug}`}>
              <Button variant="primary">Публичная страница</Button>
            </Link>
          )}
        </div>
      </div>

      {err && <Card><div style={{ color: "#fecaca" }}>{err}</div></Card>}

      {!data ? (
        <Card><div style={{ opacity: 0.75 }}>Загружаем…</div></Card>
      ) : (
        <>
          <Card>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <div>
                <div style={{ fontWeight: 700 }}>Публичная ссылка</div>
                <div style={{ marginTop: 6, opacity: 0.75, fontSize: 13, wordBreak: "break-word" }}>
                  <a href={publicUrl} target="_blank" rel="noreferrer">{publicUrl}</a>
                </div>
              </div>

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <Button variant="ghost" onClick={copyPublicLink}>Копировать</Button>
              </div>
            </div>

            {info && <div style={{ marginTop: 10, opacity: 0.85, fontSize: 13 }}>{info}</div>}
          </Card>

          <Card>
            <div style={{ fontWeight: 750, fontSize: 16 }}>Добавить подарок</div>
            <div style={{ marginTop: 6, opacity: 0.7, fontSize: 13 }}>
              Можно вставить ссылку и попробовать автозаполнение. Если не получилось — заполни вручную.
            </div>

            <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
              <div>
                <Label>Ссылка на товар</Label>
                <Input value={itemUrl} onChange={(e) => setItemUrl(e.target.value)} placeholder="https://..." />
              </div>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <Button variant="ghost" onClick={autofillByUrl} disabled={!itemUrl.trim()}>
                  Автозаполнить по ссылке
                </Button>
              </div>

              <div>
                <Label>Название</Label>
                <Input value={itemTitle} onChange={(e) => setItemTitle(e.target.value)} placeholder="AirPods / Книга / ..." />
              </div>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: 220 }}>
                  <Label>Цена (для прогресса)</Label>
                  <Input value={itemPrice} onChange={(e) => setItemPrice(e.target.value)} placeholder="например 249.00" />
                </div>
                <div style={{ flex: 2, minWidth: 260 }}>
                  <Label>Картинка (URL)</Label>
                  <Input value={itemImage} onChange={(e) => setItemImage(e.target.value)} placeholder="https://..." />
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <input
                  id="funding"
                  type="checkbox"
                  checked={allowFunding}
                  onChange={(e) => setAllowFunding(e.target.checked)}
                  style={{ width: 18, height: 18 }}
                />
                <label htmlFor="funding" style={{ opacity: 0.85, fontSize: 14 }}>
                  Разрешить скидывание (crowdfunding)
                </label>
              </div>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <Button
                  variant="primary"
                  onClick={addItem}
                  disabled={busy || !itemUrl.trim() || (!itemTitle.trim() && !itemUrl.trim())}
                >
                  Добавить
                </Button>
              </div>
            </div>
          </Card>

          <div style={{ display: "grid", gap: 12 }}>
            {data.items.length === 0 ? (
              <Card>
                <div style={{ textAlign: "center", padding: 10 }}>
                  <div style={{ fontWeight: 700, fontSize: 16 }}>Пока пусто</div>
                  <div style={{ marginTop: 6, opacity: 0.75, fontSize: 13 }}>Добавь первый подарок сверху.</div>
                </div>
              </Card>
            ) : (
              data.items.map((it) => (
                <Card key={it.id}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                    <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                      <div style={{ width: 70, height: 70, borderRadius: 14, overflow: "hidden", border: "1px solid rgba(255,255,255,.12)" }}>
                        {it.image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={it.image_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : (
                          <div style={{ width: "100%", height: "100%", background: "rgba(255,255,255,.06)" }} />
                        )}
                      </div>

                      <div style={{ minWidth: 240 }}>
                        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                          <div style={{ fontWeight: 750 }}>{it.title}</div>
                          {it.allow_funding ? <Badge>Можно скидываться</Badge> : <Badge>Без скидывания</Badge>}
                        </div>

                        <div style={{ marginTop: 6, opacity: 0.7, fontSize: 13, wordBreak: "break-word" }}>
                          <a href={it.url} target="_blank" rel="noreferrer">{it.url}</a>
                        </div>

                        {it.price != null && (
                          <div style={{ marginTop: 8, opacity: 0.85, fontSize: 13 }}>
                            Цена: <b>€{it.price.toFixed(2)}</b>
                          </div>
                        )}
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <a href={it.url} target="_blank" rel="noreferrer">
                        <Button variant="ghost">Открыть</Button>
                      </a>
                      <Button variant="danger" onClick={() => deleteItem(it.id)}>Удалить</Button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
