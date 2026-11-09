@echo off
cd /d "%~dp0"
echo Opening the portfolio at http://127.0.0.1:5175
start "" "http://127.0.0.1:5175"
py -m http.server 5175 --bind 127.0.0.1
pause
