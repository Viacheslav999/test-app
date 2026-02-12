from fastapi import APIRouter, HTTPException
import httpx
from bs4 import BeautifulSoup

router = APIRouter(prefix="/meta", tags=["meta"])


@router.get("")
async def fetch_meta(url: str):
    try:
        async with httpx.AsyncClient(follow_redirects=True, timeout=10) as client:
            r = await client.get(url, headers={"User-Agent": "Mozilla/5.0"})
            r.raise_for_status()
    except Exception:
        raise HTTPException(status_code=400, detail="Cannot fetch URL")

    soup = BeautifulSoup(r.text, "html.parser")

    def og(name: str):
        tag = soup.find("meta", property=name) or soup.find("meta", attrs={"name": name})
        return tag.get("content") if tag and tag.get("content") else None

    title = og("og:title") or (soup.title.string.strip() if soup.title and soup.title.string else None)
    image = og("og:image")

    price = og("product:price:amount") or og("og:price:amount")
    currency = og("product:price:currency") or og("og:price:currency")

    def to_float(x):
        if not x:
            return None
        try:
            return float(str(x).replace(",", "."))
        except Exception:
            return None

    return {
        "title": title,
        "image_url": image,
        "price": to_float(price),
        "currency": currency,
    }
