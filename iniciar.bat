@echo off
cd /d "%~dp0"
python -m http.server 8889
pause