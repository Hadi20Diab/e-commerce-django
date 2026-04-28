import sys

p = r'c:\Users\User\Documents\GitHub\DigitalHub\e-commerce-django\frontend\app\page.js'
with open(p, encoding='utf-8') as f:
    txt = f.read()

# Map each mojibake string (as Python unicode) to the correct character
# Derived by: bad_char.encode('cp1252') -> bytes -> .decode('utf-8')
fixes = [
    ('\u00f0\u0178\u2018\u2039', '\U0001f44b'),   # wave 👋
    ('\u00f0\u0178\u0161\u20ac', '\U0001f680'),   # rocket 🚀
    ('\u00f0\u0178\u201d\u2019', '\U0001f512'),   # lock 🔒
    ('\u00f0\u0178\u2018\u00ac', '\U0001f4ac'),   # speech 💬
    ('\u00f0\u0178\u201c\u00a5', '\U0001f525'),   # fire 🔥
    ('\u00e2\u0161\u00a1',       '\u26a1'),       # lightning ⚡
    ('\u00e2\u2020\u2019',       '\u2192'),       # right arrow →
    ('\u00e2\u2020\u00a9',       '\u21a9'),       # return ↩
    ('\u00e2\u20ac\u201d',       '\u2014'),       # em dash —
    ('\u00e2\u20ac\u00a6',       '\u2026'),       # ellipsis …
    ('\u00e2\u201c\u20ac',       '\u2500'),       # box drawing ─
]

for bad, good in fixes:
    txt = txt.replace(bad, good)

with open(p, 'w', encoding='utf-8') as f:
    f.write(txt)

remaining = [bad for bad, _ in fixes if bad in txt]
if remaining:
    print('Still has mojibake')
else:
    print('All fixed!')

