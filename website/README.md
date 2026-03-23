# Car Quiz Website

## How to Run the Website

Due to browser security (CORS policy), you need to run a local web server to use the quiz website.

### Method 1: Using Python (Recommended)

1. Open Command Prompt or PowerShell
2. Navigate to the car folder:
   ```
   cd C:\Users\vines\Desktop\car
   ```
3. Run the server script:
   ```
   python start_server.py
   ```
4. Your browser will automatically open to: `http://localhost:8000/website/`

### Method 2: Using Python's Built-in Server

1. Open Command Prompt or PowerShell
2. Navigate to the car folder:
   ```
   cd C:\Users\vines\Desktop\car
   ```
3. Run Python's HTTP server:
   ```
   python -m http.server 8000
   ```
4. Open your browser to: `http://localhost:8000/website/`

### Method 3: Using VS Code Live Server Extension

1. Install the "Live Server" extension in VS Code
2. Right-click on `website/index.html`
3. Select "Open with Live Server"

## Features

- 🎯 Random car model quiz
- 🏢 Brand identification
- 💰 Price range guessing
- 🖼️ Image recognition (10 images)
- 🚗 Body type selection
- ⚙️ Engine displacement (CC) identification
- 📊 Instant results with score breakdown
- 🎨 Beautiful gradient design

## Quiz Data

- All new cars from all brands
- All upcoming cars from all brands
- First 20 discontinued cars from each brand
- Data loaded from `brands/*.json` files

Enjoy the quiz! 🚗✨
