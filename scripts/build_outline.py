"""从《认定要素细目表》生成考纲大纲 JSON"""
import json, os, re

SRC = os.path.join(os.path.dirname(__file__), "source", "guide_table.txt")
OUT = os.path.join(os.path.dirname(__file__), "..", "src", "data", "outline.json")

# (单元 key, 单元名, [(起始行, 结束行, 分组名)])  —— 行号来自细目表提取文本，1-based
THEORY = [
    ("career", "职业道德", [(28, 34, "职业道德基本知识"), (36, 43, "职业守则")]),
    ("general", "通用基础知识", [(46, 60, "通用知识"), (62, 76, "相关法律、法规知识")]),
    ("biz-flow", "业务流程设计", [(80, 94, "流程设计工具知识"), (96, 110, "流程设计知识")]),
    ("biz-module", "业务模块效果优化", [(113, 127, "业务模块分析方法"), (129, 143, "业务模块优化方法")]),
    ("data-spec", "数据处理规范制定", [(147, 168, "训练数据处理工具原理"), (170, 191, "训练数据处理知识")]),
    ("algo-test", "算法测试", [(194, 240, "算法训练与测试")]),
    ("sys-monitor", "智能系统监控和优化", [(244, 261, "数据拆解高阶方法"), (263, 280, "数据分析高阶方法"), (282, 299, "智能解决方案设计")]),
    ("hci", "人机交互流程设计", [(302, 319, "交互设计知识"), (321, 343, "交互设计工具")]),
    ("training", "培训与指导", [(346, 348, "培训讲义编写"), (350, 356, "培训教学知识"), (357, 363, "采集/标注流程重难点")]),
]

PARTS = {
    "career": "基本要求",
    "general": "基本要求",
    "law": "基本要求",
    "biz-flow": "业务分析",
    "biz-module": "业务分析",
    "data-spec": "智能训练",
    "algo-test": "智能训练",
    "sys-monitor": "智能系统设计",
    "hci": "智能系统设计",
    "training": "培训与指导",
}

SKILLS = [
    ("业务分析", ["业务流程设计", "业务模块效果优化"]),
    ("智能训练", ["数据处理规范制定", "算法测试"]),
    ("智能系统设计", ["智能系统监控和优化", "人机交互流程设计"]),
    ("培训与指导", ["培训", "指导"]),
]


def main():
    lines = [l.rstrip("\n") for l in open(SRC, encoding="utf-8").read().split("\n")]
    units = []
    for key, name, groups in THEORY:
        gs = []
        for lo, hi, gname in groups:
            pts = [lines[i - 1].strip() for i in range(lo, hi + 1)]
            pts = [p for p in pts if p and len(p) > 1]
            gs.append({"name": gname, "points": pts})
        units.append({
            "key": key,
            "name": name,
            "part": PARTS.get(key, ""),
            "groups": gs,
            "pointCount": sum(len(g["points"]) for g in gs),
        })

    # 操作技能细目表
    skill_lines = [lines[i - 1].strip() for i in range(369, 407)]
    skill_lines = [x for x in skill_lines if x and len(x) > 1]
    skills = []
    cur_part = None
    cur_unit = None
    for s in skill_lines:
        if s in ("业务流程设计", "业务模块效果优化", "数据处理规范制定", "算法测试",
                 "智能系统监控和优化", "人机交互流程设计"):
            cur_unit = s
            continue
        if s in ("培训与指导",):
            cur_unit = "培训与指导"
            continue
        if cur_unit:
            if skills and skills[-1]["unit"] == cur_unit:
                skills[-1]["points"].append(s)
            else:
                skills.append({"unit": cur_unit, "points": [s]})

    data = {"theory": units, "skills": skills}
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    json.dump(data, open(OUT, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    total = sum(u["pointCount"] for u in units)
    print("units", len(units), "细目点", total)
    for u in units:
        print(f'{u["key"]:12} {u["name"]:12} {u["pointCount"]:3} 点  groups={[g["name"] for g in u["groups"]]}')
    print("技能项", sum(len(s["points"]) for s in skills))
    for s in skills:
        print(" ", s["unit"], len(s["points"]))


if __name__ == "__main__":
    main()
