$p = "c:\Users\User\Documents\GitHub\DigitalHub\e-commerce-django\frontend\app\page.js"
$enc = [System.Text.Encoding]::UTF8
$bytes = [System.IO.File]::ReadAllBytes($p)
$f = $enc.GetString($bytes)

# Box drawing
$f = $f.Replace([char]0x00e2 + [char]0x0094 + [char]0x0080, [char]0x2500)  # â"€ -> ─

# Arrows
$f = $f.Replace([char]0x00e2 + [char]0x0086 + [char]0x0092, [char]0x2192)  # â†' -> →
$f = $f.Replace([char]0x00e2 + [char]0x0086 + [char]0x00a9, [char]0x21a9)  # â†© -> ↩

# Em dash
$f = $f.Replace([char]0x00e2 + [char]0x0080 + [char]0x0094, [char]0x2014)  # â€" -> —

# Ellipsis
$f = $f.Replace([char]0x00e2 + [char]0x0080 + [char]0x00a6, [char]0x2026)  # â€¦ -> …

# Emoji (4-byte UTF-8 encoded as mojibake)
# 👋 U+1F44B -> F0 9F 92 8B
$f = $f.Replace([char]0x00f0 + [char]0x009f + [char]0x0091 + [char]0x008b, "👋")
# 🚀 U+1F680 -> F0 9F 9A 80
$f = $f.Replace([char]0x00f0 + [char]0x009f + [char]0x009a + [char]0x0080, "🚀")
# 🔒 U+1F512 -> F0 9F 94 92
$f = $f.Replace([char]0x00f0 + [char]0x009f + [char]0x0094 + [char]0x0092, "🔒")
# 💬 U+1F4AC -> F0 9F 92 AC
$f = $f.Replace([char]0x00f0 + [char]0x009f + [char]0x0092 + [char]0x00ac, "💬")
# 🔥 U+1F525 -> F0 9F 94 A5
$f = $f.Replace([char]0x00f0 + [char]0x009f + [char]0x0094 + [char]0x00a5, "🔥")
# ⚡ U+26A1 -> E2 9A A1
$f = $f.Replace([char]0x00e2 + [char]0x009a + [char]0x00a1, "⚡")

[System.IO.File]::WriteAllText($p, $f, $enc)
Write-Host "Done"
