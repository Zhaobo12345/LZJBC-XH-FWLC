import io, sys

p = 'owner-miniapp/contract-list.html'
with io.open(p, 'r', encoding='utf-8', newline='') as f:
    s = f.read()

# 1) 在 contract-tree-store.js 之后插入 contract-data.js
marker = '<script src="js/contract-tree-store.js"></script>'
assert marker in s, 'tree-store marker not found'
inject = marker + '\n<script src="js/contract-data.js"></script>'
s = s.replace(marker, inject, 1)

# 2) 用共享数据替换内联 CONTRACTS 数组 + 合并行
start = s.index('var CONTRACTS = [')
merge_line = 'if (window.ContractTreeStore) CONTRACTS = ContractTreeStore.merge(CONTRACTS);'
end = s.index(merge_line) + len(merge_line)
replacement = 'var CONTRACTS = window.OWNER_CONTRACTS;'
s = s[:start] + replacement + s[end:]

with io.open(p, 'w', encoding='utf-8', newline='') as f:
    f.write(s)
print('contract-list.html updated; CONTRACTS now references window.OWNER_CONTRACTS')
