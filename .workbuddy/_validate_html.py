from html.parser import HTMLParser
import sys

class V(HTMLParser):
    def __init__(self):
        super().__init__()
        self.stack = []
        self.sc = {'area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr'}
    def handle_starttag(self, t, a):
        if t in self.sc: return
        self.stack.append(t)
    def handle_endtag(self, t):
        if t in self.sc: return
        if self.stack and self.stack[-1] == t:
            self.stack.pop()
        else:
            print('MISMATCH', self.stack[-1] if self.stack else 'None', t)
    def done(self):
        print('UNCLOSED', self.stack) if self.stack else print('BALANCED')

v = V()
v.feed(open(r'D:\TraeProject\LZJPro\LZJBC-XH\service-miniapp\worker-contract-detail.html', encoding='utf-8').read())
v.done()
