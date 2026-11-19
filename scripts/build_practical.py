"""把抓下来的 40 道实操题页面解析成结构化 JSON，并反推代码填空的标准答案

输出 src/data/practical.json
字段：
  id/unit/unitName/subName/part/title/duration
  sections   试题单正文（按 h1/h2 切分）
  rubric     评分细则 [{id, score, desc}]
  skeleton   代码骨架（单元格数组，空白处是 ______）
  blanks     每个空的标准答案 [{cell, line, answer}]
  steps      图文教程 [{title, items:[{code, notes}]}]
"""
import re, os, json
from html.parser import HTMLParser

HERE = os.path.dirname(__file__)
SRC = os.path.join(HERE, "source", "pages")
OUT = os.path.join(HERE, "..", "src", "data", "practical.json")

UNITS = {
    "1.1": ("数据预处理流程", "数据分析（代码）", "业务分析", 25),
    "1.2": ("业务模块效果优化", "产品优化（简单）", "业务分析", 25),
    "2.1": ("数据处理规范制定", "数据清洗（代码）", "智能训练", 15),
    "2.2": ("模型算法测试", "数据建模（代码）", "智能训练", 20),
    "3.1": ("智能系统监控和优化", "产品优化（Excel）", "智能系统设计", 15),
    "3.2": ("人机交互流程设计", "模型部署（代码）", "智能系统设计", 20),
    "4.1": ("培训与指导", "培训（讲义/大纲）", "培训与指导", 5),
    "4.2": ("培训与指导", "指导（问题排查）", "培训与指导", 5),
}

BLANK = re.compile(r"_{3,}")

# 自动对齐失败的少数空位，人工核对图文教程后填回
OVERRIDES = {
    "1.1.3": {(2, 3): ["data['LoanAmount']", "data['Income']"]},
    "1.1.5": {(1, 11): ["data['Age'].between"], (1, 14): ["data['TravelTime'].between"],
              (2, 5): ["data['TravelTime'].between"]},
    "2.1.2": {(0, 21): ["'1.您的性别○男性 ○女性', '2.您的年级○大一 ○大二 ○大三 ○大四', "
                        "'3.您的生源地○农村 ○城镇（乡镇） ○地县级城市 ○省会城市及直辖市', "
                        "'4.您的月生活费○≦1,000元 ○1,001-2,000元 ○2,001-3,000元 ○≧3,001元', "
                        "'5.您进行过绿色低碳的相关生活方式吗?', '6.您觉得“低碳”，与你的生活关系密切吗？', "
                        "'7.低碳生活是否会成为未来的主流生活方式？', '8.您是否认为低碳生活会提高您的生活质量？'"]},
    "2.1.3": {(0, 32): ["IQR", "IQR"]},
    "2.1.5": {(0, 52): ["exercise_frequency_counts.plot.pie"]},
    "2.2.4": {(0, 52): ["XGBRegressor", "n_estimators=1000, learning_rate=0.05, max_depth=5"]},
    "3.2.3": {(0, 20): ["'neutral':0, 'happiness':1, 'surprise':2, 'sadness':3, 'anger':4, "
                        "'disgust':5, 'fear':6, 'contempt':7"]},
}


class Blocks(HTMLParser):
    """从 vp-doc 片段抽取块级结构：h1/h2/h3, p, li, table, pre-code"""

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.blocks, self.buf, self.cur = [], [], None
        self.in_pre, self.pre_buf, self.skip = False, [], 0
        self.table = None
        self.row = None

    def flush(self):
        if self.cur:
            text = re.sub(r"[ \t]+", " ", "".join(self.buf)).strip()
            if text:
                self.blocks.append({"k": self.cur, "t": text})
            self.buf, self.cur = [], None

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == "a" and "header-anchor" in (a.get("class") or ""):
            self.skip = 1
            return
        if self.skip:
            return
        if tag == "pre":
            self.in_pre, self.pre_buf = True, []
            return
        if self.in_pre:
            return
        if tag in ("h1", "h2", "h3", "h4"):
            self.flush()
            self.cur = "h" + tag[1]
        elif tag == "p":
            self.flush()
            self.cur = "p"
        elif tag == "li":
            self.flush()
            self.cur = "li"
        elif tag == "table":
            self.flush()
            self.table = []
        elif tag == "tr" and self.table is not None:
            self.row = []
        elif tag in ("td", "th") and self.row is not None:
            self.cur, self.buf = "cell", []
        elif tag == "br":
            self.buf.append("\n")

    def handle_endtag(self, tag):
        if skip_end := (tag == "a" and self.skip):
            self.skip = 0
            return
        if self.skip:
            return
        if tag == "pre" and self.in_pre:
            self.in_pre = False
            code = "".join(self.pre_buf).strip("\n")
            if code.strip():
                self.blocks.append({"k": "code", "t": code})
            return
        if self.in_pre:
            return
        if tag in ("h1", "h2", "h3", "h4", "p", "li"):
            self.flush()
        elif tag in ("td", "th") and self.row is not None:
            text = re.sub(r"[ \t]+", " ", "".join(self.buf)).strip()
            self.row.append(text)
            self.buf, self.cur = [], None
        elif tag == "tr" and self.table is not None:
            if self.row:
                self.table.append(self.row)
            self.row = None
        elif tag == "table" and self.table is not None:
            if self.table:
                self.blocks.append({"k": "table", "t": self.table})
            self.table = None

    def handle_data(self, data):
        if self.skip:
            return
        if self.in_pre:
            self.pre_buf.append(data)
        elif self.cur:
            self.buf.append(data)


def doc_blocks(path):
    if not os.path.exists(path):
        return []
    h = open(path, encoding="utf-8", errors="replace").read()
    i = h.find('class="vp-doc')
    j = h.find("</main>", i) if i >= 0 else -1
    if i < 0 or j < 0:
        return []
    p = Blocks()
    p.feed(h[i:j])
    p.flush()
    return p.blocks


def split_sections(blocks):
    secs, cur = [], {"title": "试题概览", "blocks": []}
    for b in blocks:
        if b["k"] in ("h1", "h2"):
            if cur["blocks"] or cur["title"] != "试题概览":
                secs.append(cur)
            cur = {"title": b["t"], "blocks": []}
        else:
            cur["blocks"].append(b)
    if cur["blocks"]:
        secs.append(cur)
    return secs


def parse_rubric(blocks):
    rows = []
    for b in blocks:
        if b["k"] != "table":
            continue
        for r in b["t"]:
            if len(r) >= 3 and re.match(r"^M\d+$", r[0].strip()):
                s = r[1].strip()
                rows.append({
                    "id": r[0].strip(),
                    "score": float(s) if re.fullmatch(r"[\d.]+", s) else 0,
                    "desc": r[2].strip(),
                    "ref": r[3].strip() if len(r) > 3 else "",
                })
    return rows


def parse_steps(blocks):
    steps, cur = [], None
    for b in blocks:
        if b["k"] in ("h1", "h2"):
            cur = {"title": b["t"], "items": []}
            steps.append(cur)
        elif cur is not None:
            if b["k"] == "code":
                cur["items"].append({"code": b["t"], "notes": []})
            elif b["k"] in ("p", "li"):
                if cur["items"]:
                    cur["items"][-1]["notes"].append(b["t"])
                else:
                    cur.setdefault("lead", []).append(b["t"])
    return [s for s in steps if s["items"] or s.get("lead")]


def strip_comment(s):
    if "#" not in s:
        return s
    q = None
    for i, ch in enumerate(s):
        if q:
            if ch == q:
                q = None
        elif ch in "'\"":
            q = ch
        elif ch == "#":
            return s[:i]
    return s


def build_pattern(line):
    """xx____yy____  ->  xx([^\n]+?)yy([^\n]+)"""
    code = strip_comment(line).rstrip()
    parts = BLANK.split(code)
    if len(parts) == 1:
        return None, 0
    esc = [re.escape(p.strip()) for p in parts]
    groups = ["([^\\n]+?)"] * (len(esc) - 1)
    if not parts[-1].strip():
        groups[-1] = "([^\\n]+)"
    pat = "".join(e + (groups[i] if i < len(groups) else "") for i, e in enumerate(esc))
    return pat, len(parts) - 1


def solve_blanks(tid, skeleton, steps):
    ref = "\n".join(it["code"] for st in steps for it in st["items"])
    over = OVERRIDES.get(tid, {})
    blanks, cursor = [], 0
    for ci, cell in enumerate(skeleton):
        for li, line in enumerate(cell.split("\n")):
            if not BLANK.search(line):
                continue
            if (ci, li) in over:
                for a in over[(ci, li)]:
                    blanks.append({"cell": ci, "line": li, "answer": a})
                continue
            pat, n = build_pattern(line)
            if not pat:
                continue
            m = re.search(pat, ref[cursor:])
            if m:
                cursor += m.end()
                answers = [g.strip() for g in m.groups()]
            else:
                answers = [""] * n
            for a in answers:
                blanks.append({"cell": ci, "line": li, "answer": a})
    return blanks


def main():
    tasks = []
    ids = [f"1.1.{i}" for i in range(1, 6)] + [f"1.2.{i}" for i in range(1, 6)] \
        + [f"2.1.{i}" for i in range(1, 6)] + [f"2.2.{i}" for i in range(1, 6)] \
        + [f"3.1.{i}" for i in range(1, 6)] + [f"3.2.{i}" for i in range(1, 6)] \
        + [f"4.1.{i}" for i in range(1, 6)] + [f"4.2.{i}" for i in range(1, 6)]

    missing = 0
    for tid in ids:
        unit = ".".join(tid.split(".")[:2])
        unit_name, sub_name, part, score = UNITS[unit]
        q = doc_blocks(os.path.join(SRC, f"{tid}_question.html"))
        if not q:
            missing += 1
            print("MISSING", tid)
            continue
        title = next((b["t"] for b in q if b["k"] == "h1"), tid)
        secs = split_sections(q)
        head = ""
        for s in secs:
            for b in s["blocks"]:
                if "试题代码" in b["t"]:
                    head = b["t"]
        dur = ""
        m = re.search(r"考核时间[：:]\s*([0-9]+\s*(?:min|分钟))", head)
        if m:
            dur = m.group(1).replace(" ", "")
        rubric = parse_rubric(doc_blocks(os.path.join(SRC, f"{tid}_rubric.html")))
        skeleton = [b["t"] for b in doc_blocks(os.path.join(SRC, f"{tid}_code.html")) if b["k"] == "code"]
        steps = parse_steps(doc_blocks(os.path.join(SRC, f"{tid}_step-by-step.html")))
        blanks = solve_blanks(tid, skeleton, steps) if skeleton else []

        tasks.append({
            "id": tid,
            "unit": unit,
            "unitName": unit_name,
            "subName": sub_name,
            "part": part,
            "title": title,
            "duration": dur or "20min",
            "fullScore": score,
            "sections": secs,
            "rubric": rubric,
            "skeleton": skeleton,
            "blanks": blanks,
            "steps": steps,
            "hasCode": bool(skeleton),
        })

    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    json.dump(tasks, open(OUT, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    nb = sum(len(t["blanks"]) for t in tasks)
    empty = sum(1 for t in tasks for b in t["blanks"] if not b["answer"])
    print(f"tasks {len(tasks)} missing {missing} blanks {nb} empty {empty}")
    for t in tasks:
        if t["blanks"]:
            n = len(t["blanks"])
            e = sum(1 for b in t["blanks"] if not b["answer"])
            print(f'  {t["id"]:7} blanks={n:3} empty={e}')


if __name__ == "__main__":
    main()
