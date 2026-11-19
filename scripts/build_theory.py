"""构建理论知识题库 JSON（900 题，含答案与解析）"""
import json, os, re

SRC = os.path.join(os.path.dirname(__file__), "source", "theory_raw.json")
OUT = os.path.join(os.path.dirname(__file__), "..", "src", "data", "theory.json")

# 复习题按《认定要素细目表》顺序编排，各题型章节边界一致
CHAPTERS = [
    ("career", 1, 15, "职业道德", "基本要求", "职业道德基本知识 + 职业守则"),
    ("general", 16, 30, "通用基础知识", "基本要求", "Windows / 浏览器 / Office 办公"),
    ("law", 31, 45, "法律法规与知识产权", "基本要求", "劳动合同 / 网络安全 / 专利著作权"),
    ("biz-flow", 46, 75, "业务流程设计", "业务分析", "采集、ETL、存储、治理、可视化工具与流程"),
    ("biz-module", 76, 105, "业务模块效果优化", "业务分析", "AI 业务模块、数据挖掘、流程优化"),
    ("data-spec", 106, 149, "数据处理规范制定", "智能训练", "机器学习基础、预处理、标注、特征工程"),
    ("algo-test", 150, 195, "算法测试", "智能训练", "训练流程、超参、评估指标、测试与部署"),
    ("sys-monitor", 196, 249, "智能系统监控和优化", "智能系统设计", "特征拆解、统计与机器学习、解决方案"),
    ("hci", 250, 285, "人机交互流程设计", "智能系统设计", "交互模型、原型工具、可用性"),
    ("training", 286, 300, "培训与指导", "培训与指导", "培训讲义、培训方法、指导要点"),
]

KIND_NAME = {"judge": "判断题", "single": "单选题", "multi": "多选题"}


def chapter_of(no):
    for key, lo, hi, name, part, note in CHAPTERS:
        if lo <= no <= hi:
            return key, name, part
    return "misc", "其他", "其他"


def main():
    raw = json.load(open(SRC, encoding="utf-8"))
    out = []
    for q in raw:
        key, name, part = chapter_of(q["no"])
        opts = q.get("options") or []
        item = {
            "id": f'{q["type"]}-{q["no"]}',
            "kind": q["type"],
            "kindName": KIND_NAME[q["type"]],
            "no": q["no"],
            "chapter": key,
            "chapterName": name,
            "part": part,
            "stem": q["stem"].strip(),
            "options": [{"k": o["key"], "t": o["text"].strip()} for o in opts],
            "answer": q["answer"].strip(),
            "explain": (q.get("explain") or "").strip(),
        }
        out.append(item)

    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    json.dump(out, open(OUT, "w", encoding="utf-8"), ensure_ascii=False, indent=0)

    # 统计
    from collections import Counter
    c = Counter((x["chapter"], x["kind"]) for x in out)
    print("total", len(out))
    chs = [c[0] for c in CHAPTERS]
    for key, lo, hi, name, part, note in CHAPTERS:
        j, s, m = c[(key, "judge")], c[(key, "single")], c[(key, "multi")]
        print(f"{key:12} {name:12} 判断{j:3} 单选{s:3} 多选{m:3}  合计 {j+s+m:3}")
    print("chapters", chs)


if __name__ == "__main__":
    main()
