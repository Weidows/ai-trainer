"""抓取 nccloudservice 的人工智能训练师（三级）40 道实操题页面
用法: python scripts/fetch_pages.py      # 全量补齐到 scripts/source/pages/
说明: 1.2.x / 3.1.x / 4.x 属于非代码题，站点没有 code / step-by-step 页面（404 正常）。
"""
import urllib.request, os

BASE = "https://ai-trainer.nccloudservice.com"
OUT = os.path.join(os.path.dirname(__file__), "source", "pages")
KINDS = ["question", "rubric", "code", "step-by-step"]

IDS = [f"1.1.{i}" for i in range(1, 6)] + [f"1.2.{i}" for i in range(1, 6)] \
    + [f"2.1.{i}" for i in range(1, 6)] + [f"2.2.{i}" for i in range(1, 6)] \
    + [f"3.1.{i}" for i in range(1, 6)] + [f"3.2.{i}" for i in range(1, 6)] \
    + [f"4.1.{i}" for i in range(1, 6)] + [f"4.2.{i}" for i in range(1, 6)]


def url_of(tid, kind):
    unit = ".".join(tid.split(".")[:2])
    group = unit if unit in ("1.1", "1.2", "2.1", "2.2", "3.1", "3.2") else "4"
    return f"{BASE}/{group}/{tid}/{kind}.html"


def main():
    os.makedirs(OUT, exist_ok=True)
    for tid in IDS:
        for kind in KINDS:
            path = os.path.join(OUT, f"{tid}_{kind}.html")
            if os.path.exists(path) and os.path.getsize(path) > 1000:
                continue
            try:
                req = urllib.request.Request(url_of(tid, kind), headers={"User-Agent": "Mozilla/5.0"})
                with urllib.request.urlopen(req, timeout=40) as r:
                    open(path, "wb").write(r.read())
                print("ok  ", tid, kind)
            except Exception as e:
                print("skip", tid, kind, e)


if __name__ == "__main__":
    main()
