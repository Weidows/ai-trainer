"""生成速查页数据：代码速记表 + 应试统计 + 高频易错点

输入: scripts/source/memo-table.html（站点速记表快照）, src/data/theory.json
输出: src/data/cheatsheet.json
"""
import re, os, json, html
from collections import Counter

HERE = os.path.dirname(__file__)
MEMO = os.path.join(HERE, "source", "memo-table.html")
THEORY = os.path.join(HERE, "..", "src", "data", "theory.json")
PRACTICAL = os.path.join(HERE, "..", "src", "data", "practical.json")
OUT = os.path.join(HERE, "..", "src", "data", "cheatsheet.json")


def text_of(cell):
    t = re.sub(r"<br\s*/?>", " / ", cell)
    t = html.unescape(re.sub(r"<[^>]+>", "", t))
    return re.sub(r"\s+", " ", t).strip()


def parse_memo():
    h = open(MEMO, encoding="utf-8").read()
    rows = re.findall(r"<tr>(.*?)</tr>", h, re.S)[1:]  # 跳过表头
    out, chapter = [], ""
    for r in rows:
        cells = re.findall(r"<td([^>]*)>(.*?)</td>", r, re.S)
        vals, rs_chapter = [], None
        for attrs, body in cells:
            m = re.search(r'rowspan="(\d+)"', attrs)
            if m:
                rs_chapter = text_of(body)
                chapter = rs_chapter
                continue
            vals.append(text_of(body))
        if len(vals) >= 5:
            out.append({
                "chapter": chapter,
                "point": vals[0],
                "meaning": vals[1],
                "code": vals[2],
                "analogy": vals[3],
                "mnemonic": vals[4],
            })
    return out


def theory_stats(theory):
    kinds = Counter(q["kind"] for q in theory)
    judge = Counter(q["answer"] for q in theory if q["kind"] == "judge")
    multi_len = Counter(len(q["answer"]) for q in theory if q["kind"] == "multi")
    single = Counter(q["answer"] for q in theory if q["kind"] == "single")
    abs_words = ["只有", "一定", "必须", "所有", "完全", "唯一", "都不", "均不", "不能", "无法"]
    judge_abs = [q for q in theory if q["kind"] == "judge" and any(w in q["stem"] for w in abs_words)]
    abs_wrong = sum(1 for q in judge_abs if q["answer"] == "×")
    return {
        "count": len(theory),
        "kinds": dict(kinds),
        "judgeAnswer": {"√": judge.get("√", 0), "×": judge.get("×", 0)},
        "multiAnswerLen": {str(k): v for k, v in sorted(multi_len.items())},
        "singleAnswer": dict(sorted(single.items())),
        "judgeAbsolute": {
            "total": len(judge_abs),
            "wrong": abs_wrong,
            "rate": round(abs_wrong / len(judge_abs) * 100) if judge_abs else 0,
            "words": abs_words,
        },
    }


# ---- 高频易错点（人工整理：来自官方评分细则的扣分点 + 题库中的共性陷阱）----
PITFALLS = [
    {"tag": "实操·交付", "level": "致命", "title": "截图文件名必须逐字对上",
     "body": "题干要求「1.1.1-1.jpg」就写 1.1.1-1.jpg，大小写、横线、序号都不能变。评分细则里 M1~M3 通常按「数据正确得 1 分」给分，文件没上传等于这几分直接零。",
     "code": None},
    {"tag": "实操·交付", "level": "致命", "title": "考生文件夹命名：准考证号 + 身份证后六位",
     "body": "所有结果落在这个文件夹里，考完要上传的 ipynb 也要按题目要求导出 HTML（File → Download as → HTML）。",
     "code": None},
    {"tag": "实操·代码", "level": "高", "title": "只填下划线，别动其他代码",
     "body": "骨架里 print 语句、区间定义都是给分依据，随意增删会导致输出对不上，评分项成片丢分。",
     "code": None},
    {"tag": "实操·代码", "level": "高", "title": "pd.cut 的 right=False 不要漏",
     "body": "题目写「18.5～23.9、24.0～27.9」这种左闭右开区间，必须 right=False，否则边界值会落错桶，后面比例全错。",
     "code": "pd.cut(data['BMI'], bins=bmi_bins, labels=bmi_labels, right=False)"},
    {"tag": "实操·代码", "level": "高", "title": "比例 = 计数 / len(data)",
     "body": "value_counts() 出来的是计数，除以总行数才是占比。分母写成 risk_counts.sum() 在同一份数据上碰巧也对，但清洗过行数后容易出错。",
     "code": "ratio = risk_counts['高风险患者'] / len(data)"},
    {"tag": "实操·代码", "level": "高", "title": "分组求比例：groupby + apply(lambda … .mean())",
     "body": "布尔序列的 mean() 就是比例，这是评分细则里反复出现的一行 2 分。",
     "code": "data.groupby('BMIRange')['RiskLevel'].apply(lambda x: (x == '高风险患者').mean())"},
    {"tag": "实操·代码", "level": "中", "title": "np.where 做二分类打标",
     "body": "先建新列再统计，题目要求「创建新列 RiskLevel」时不能只打印布尔结果。",
     "code": "data['RiskLevel'] = np.where(data['DaysInHospital'] > 7, '高风险患者', '低风险患者')"},
    {"tag": "实操·代码", "level": "中", "title": "缺失值顺序：先看行数，再删，再比行数",
     "body": "2.1.x 数据清洗常见「记录删除行数」的给分点，要先 shape[0] 存变量再 dropna()。",
     "code": "n0 = data.shape[0]\ndata = data.dropna()\nprint(n0 - data.shape[0])"},
    {"tag": "实操·代码", "level": "中", "title": "标准化：fit_transform 用训练数据的那一套",
     "body": "StandardScaler 只对数值列做，且列名要先挑出来，不要整个 DataFrame 丢进去（含字符串列会报错）。",
     "code": "scaler = StandardScaler()\ndata[num_cols] = scaler.fit_transform(data[num_cols])"},
    {"tag": "实操·代码", "level": "中", "title": "画图出口径：饼图要 autopct",
     "body": "3.1.x / 2.1.5 常要求占比饼图，(value_counts).plot.pie(autopct='%1.1f%%') 一行搞定，截图只截输出结果。",
     "code": "counts.plot.pie(autopct='%1.1f%%', startangle=90)"},
    {"tag": "实操·代码", "level": "中", "title": "onnx 推理三步：预处理 → run → argmax",
     "body": "3.2.x 的模型部署题，输入张量形状要和 session.get_inputs()[0].shape 对齐，np.expand_dims 补 batch 维是常见 1 分点。",
     "code": "sess = ort.InferenceSession('resnet.onnx')\nout = sess.run(None, {sess.get_inputs()[0].name: x})\nlabel = np.argmax(out[0])"},
    {"tag": "理论·答题", "level": "高", "title": "判断题没把握时优先判「√」",
     "body": "本题库 300 道判断题里 203 道答案是 √（68%），只有 97 道是 ×。绝对化措辞（只有/唯一/所有）只在一半左右是错的，别当作铁律，见下方统计。",
     "code": None},
    {"tag": "理论·答题", "level": "高", "title": "多选题基本是 3~5 项，别只敢选两个",
     "body": "本题库 300 道多选题：正解 4 项 106 道、3 项 96 道、5 项全选 72 道，只选 2 项的仅 26 道（9%）。拿不准时凑到 3 项以上。",
     "code": None},
    {"tag": "理论·答题", "level": "中", "title": "先扫完 180 道判断+单选，再回来啃 10 道多选",
     "body": "整卷 190 题 90 分钟：判断 40 + 单选 140 每题 0.5 分，多选 10 道每题 1 分。多选性价比最低又最耗时，留到最后。",
     "code": None},
]


def main():
    memo = parse_memo()
    theory = json.load(open(THEORY, encoding="utf-8"))
    practical = json.load(open(PRACTICAL, encoding="utf-8"))
    stats = theory_stats(theory)

    chapters = []
    seen = []
    for row in memo:
        if row["chapter"] not in seen:
            seen.append(row["chapter"])
            chapters.append({"name": row["chapter"], "rows": []})
        chapters[-1]["rows"].append(row)

    data = {
        "memo": chapters,
        "memoCount": len(memo),
        "stats": stats,
        "pitfalls": PITFALLS,
        "practicalCount": len(practical),
        "blankCount": sum(len(t["blanks"]) for t in practical),
    }
    json.dump(data, open(OUT, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print("memo rows", len(memo), "chapters", [c["name"] for c in chapters])
    print(json.dumps(stats, ensure_ascii=False, indent=1))


if __name__ == "__main__":
    main()
