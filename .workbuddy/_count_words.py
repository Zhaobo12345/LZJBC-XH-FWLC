import re, html

files = [
    "D:/TraeProject/LZJPro/LZJBC-XH/PRD-完整文档.html",
    "D:/TraeProject/LZJPro/LZJBC-XH/PRD-项目模块详细规格.html",
    "D:/TraeProject/LZJPro/LZJBC-XH/PRD-任务模块详细规格.html",
    "D:/TraeProject/LZJPro/LZJBC-XH/PRD-合同模块详细规格.html",
    "D:/TraeProject/LZJPro/LZJBC-XH/PRD-PC端其他模块详细规格.html",
]

def count_chars(path):
    with open(path, encoding="utf-8") as f:
        s = f.read()
    # remove script/style blocks
    s = re.sub(r"<script[\s\S]*?</script>", " ", s, flags=re.I)
    s = re.sub(r"<style[\s\S]*?</style>", " ", s, flags=re.I)
    # strip tags
    s = re.sub(r"<[^>]+>", " ", s)
    # unescape entities
    s = html.unescape(s)
    # keep only visible chars: count all non-whitespace chars
    chars = re.findall(r"\S", s)
    # also count CJK and alphanumeric separately for sanity
    cjk = re.findall(r"[\u4e00-\u9fff]", s)
    return len(chars)

total = 0
print(f"{'文件':<40}{'字数(去空白可见字符)'}")
print("-" * 60)
for f in files:
    c = count_chars(f)
    total += c
    print(f"{f.split('/')[-1]:<40}{c}")
print("-" * 60)
print(f"{'全部文档合计':<40}{total}")
