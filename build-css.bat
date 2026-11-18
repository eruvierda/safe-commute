@echo off
echo Building Tailwind CSS for SafeCommute PHP/HTML5...

if not exist "bin\tailwindcss.exe" (
    echo Downloading standalone Tailwind CLI binary (no Node needed)...
    mkdir bin 2>nul
    powershell -Command "Invoke-WebRequest -Uri https://github.com/tailwindlabs/tailwindcss/releases/latest/download/tailwindcss-windows-x64.exe -OutFile bin\tailwindcss.exe"
)

bin\tailwindcss.exe -c tailwind.standalone.config.js -i public_html\assets\css\src.css -o public_html\assets\css\app.css --minify
echo Tailwind build completed! Output: public_html\assets\css\app.css
