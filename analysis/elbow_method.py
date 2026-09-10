"""Elbow method: helps pick k before running clustering.py (k is fixed at 3 there,
this just shows why 3 groups is a reasonable choice for this product catalog).

Usage:
    pip install -r requirements.txt
    python elbow_method.py
"""
import os

import matplotlib.pyplot as plt
import pandas as pd
import requests
from dotenv import load_dotenv
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler

load_dotenv()

API_BASE_URL = os.environ.get("API_BASE_URL", "http://localhost:3038").rstrip("/")


def main() -> None:
    res = requests.get(f"{API_BASE_URL}/api/products", timeout=10)
    res.raise_for_status()
    df = pd.DataFrame(res.json())
    if df.empty:
        raise SystemExit("No products returned from the API.")

    scaled = StandardScaler().fit_transform(df[["price"]])
    max_k = min(9, len(df))

    inertias = []
    for k in range(1, max_k + 1):
        km = KMeans(n_clusters=k, random_state=42, n_init=10)
        km.fit(scaled)
        inertias.append(km.inertia_)

    plt.plot(range(1, max_k + 1), inertias, marker="o")
    plt.xlabel("Number of clusters (k)")
    plt.ylabel("Inertia")
    plt.title("Elbow method — product price clustering")
    plt.savefig("elbow_chart.png")
    print("Saved chart to analysis/elbow_chart.png")
    print(dict(zip(range(1, max_k + 1), [round(v, 2) for v in inertias])))


if __name__ == "__main__":
    main()
