"""K-Means grouping of products into 3 price tiers: cheap / mid / expensive.

Pipeline: GET /api/products -> StandardScaler -> KMeans(n_clusters=3, n_init=10)
-> PATCH /api/admin/products/price-tiers (persists the result so the app can show it).

Usage:
    pip install -r requirements.txt
    python clustering.py
"""
import os
import sys

import pandas as pd
import requests
from dotenv import load_dotenv
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler

load_dotenv()

API_BASE_URL = os.environ.get("API_BASE_URL", "http://localhost:3038").rstrip("/")
ADMIN_USERNAME = os.environ.get("ADMIN_USERNAME")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD")

# ถ้ามีมากกว่า 2 ระดับราคาที่ต่างกันจริง ให้ใช้ 3 กลุ่ม; ถ้าน้อยกว่านั้นลดจำนวนกลุ่มลงเพื่อไม่ให้ KMeans พัง
TIER_NAMES_BY_K = {
    1: ["mid"],
    2: ["cheap", "expensive"],
    3: ["cheap", "mid", "expensive"],
}


def fetch_products() -> pd.DataFrame:
    res = requests.get(f"{API_BASE_URL}/api/products", timeout=10)
    res.raise_for_status()
    df = pd.DataFrame(res.json())
    if df.empty:
        raise SystemExit("No products returned from the API — nothing to cluster.")
    return df


def cluster_by_price(df: pd.DataFrame) -> pd.DataFrame:
    k = min(3, df["price"].nunique())
    if k < 1:
        k = 1

    if k == 1:
        df["cluster"] = 0
    else:
        scaled = StandardScaler().fit_transform(df[["price"]])
        kmeans = KMeans(n_clusters=k, random_state=42, n_init=10)
        df["cluster"] = kmeans.fit_predict(scaled)

    # เรียง cluster ตามราคาเฉลี่ยจากน้อยไปมาก แล้วตั้งชื่อ tier ให้ตรงกับฝั่ง frontend
    cluster_means = df.groupby("cluster")["price"].mean().sort_values()
    tier_names = TIER_NAMES_BY_K[k]
    tier_by_cluster = {cluster: tier_names[rank] for rank, cluster in enumerate(cluster_means.index)}
    df["price_tier"] = df["cluster"].map(tier_by_cluster)
    return df


def print_report(df: pd.DataFrame) -> None:
    print("\n=== Cluster results (per product) ===")
    print(df[["id", "name", "price", "price_tier"]].sort_values("price").to_string(index=False))

    print("\n=== Cluster characteristics ===")
    summary = (
        df.groupby("price_tier")["price"]
        .agg(count="count", min_price="min", max_price="max", avg_price="mean")
        .reindex(["cheap", "mid", "expensive"])
        .dropna(how="all")
    )
    print(summary.round(2).to_string())


def get_admin_token() -> str:
    if not ADMIN_USERNAME or not ADMIN_PASSWORD:
        raise SystemExit(
            "ADMIN_USERNAME / ADMIN_PASSWORD are not set in analysis/.env — "
            "cannot save results back to the database. See .env.example."
        )
    res = requests.post(
        f"{API_BASE_URL}/api/auth/login",
        json={"username": ADMIN_USERNAME, "password": ADMIN_PASSWORD, "role": "admin"},
        timeout=10,
    )
    if not res.ok:
        raise SystemExit(f"Admin login failed: {res.status_code} {res.text}")
    return res.json()["token"]


def save_tiers(df: pd.DataFrame, token: str) -> None:
    tiers = [{"id": int(row.id), "priceTier": row.price_tier} for row in df.itertuples()]
    res = requests.patch(
        f"{API_BASE_URL}/api/admin/products/price-tiers",
        json={"tiers": tiers},
        headers={"Authorization": f"Bearer {token}"},
        timeout=10,
    )
    if not res.ok:
        raise SystemExit(f"Failed to save price tiers: {res.status_code} {res.text}")
    print(f"\n{res.json().get('message', 'Saved.')}")


def main() -> None:
    df = fetch_products()
    df = cluster_by_price(df)
    print_report(df)

    token = get_admin_token()
    save_tiers(df, token)


if __name__ == "__main__":
    try:
        main()
    except requests.exceptions.RequestException as err:
        sys.exit(f"Could not reach the API at {API_BASE_URL}: {err}")
