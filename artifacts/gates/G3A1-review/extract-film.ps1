# Real encoded application frames; no fps filter, interpolation or retouching.
$ffmpeg = Join-Path $env:LOCALAPPDATA 'ms-playwright\ffmpeg-1013\ffmpeg-win64.exe'
if (-not (Test-Path -LiteralPath $ffmpeg)) { throw 'Existing Playwright FFmpeg executable unavailable; do not install implicitly.' }
New-Item -ItemType Directory -Path artifacts/gates/G3A1-review/film-frames -Force | Out-Null
foreach ($second in @(6,18,21,27,32,40,50)) {
    & $ffmpeg -hide_banner -loglevel error -ss $second -i artifacts/gates/G3A1-review/playback-and-reverse.webm -frames:v 1 -y ('artifacts/gates/G3A1-review/film-frames/second-' + $second + '.png')
    if ($LASTEXITCODE -ne 0) { throw ('Frame extraction failed at second ' + $second) }
}
