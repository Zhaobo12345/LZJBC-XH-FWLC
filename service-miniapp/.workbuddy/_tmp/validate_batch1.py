#!/usr/bin/env python3
# -*- coding: utf-8 -*-
from html.parser import HTMLParser
import sys, os

class V(HTMLParser):
    def __init__(self):
        super().__init__()
        self.stack = []
        self.sc = {'area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr'}
        self.errors = []
    def handle_starttag(self, t, a):
        if t in self.sc: return
        self.stack.append(t)
    def handle_endtag(self, t):
        if t in self.sc: return
        if self.stack and self.stack[-1] == t:
            self.stack.pop()
        else:
            self.errors.append('MISMATCH %s vs %s' % (self.stack[-1] if self.stack else 'None', t))
    def done(self):
        if self.errors:
            return 'ERRORS: ' + '; '.join(self.errors)
        if self.stack:
            return 'UNCLOSED: ' + str(self.stack)
        return 'BALANCED'

FILES = [
    "contract-list.html","project-list.html","project-detail-initial-v2.html",
    "project-detail-completed-v2.html","service-contract-copy-initiate.html",
    "worker-contract-change.html","create-contract.html","project-files.html",
    "contract-preview.html","activity-list-empty.html","member-empty.html",
    "project-files-empty.html","statement-list-empty.html","todo-list-empty.html",
    "task-list-empty.html","wechat-service-notice.html",
]

base = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
allok = True
for fn in FILES:
    p = os.path.join(base, fn)
    with open(p, 'r', encoding='utf-8', newline='') as f:
        c = f.read()
    v = V(); v.feed(c); r = v.done()
    if r != 'BALANCED':
        allok = False
    print(('OK  ' if r=='BALANCED' else 'FAIL') + ' ' + fn + ' -> ' + r)
print('ALL BALANCED' if allok else 'HAS FAILURES')
