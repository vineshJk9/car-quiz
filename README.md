# 🚗 Pakistan Cars Quiz & Scraper Project

A comprehensive web application for learning about Pakistani cars through interactive quizzes, combined with a powerful web scraper to extract car data from PakWheels.com.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Usage](#usage)
  - [Running the Scraper](#running-the-scraper)
  - [Running the Quiz Website](#running-the-quiz-website)
- [Quiz Tabs](#quiz-tabs)
- [Data Structure](#data-structure)
- [Technologies Used](#technologies-used)
- [Configuration](#configuration)

---

## 🎯 Overview

This project consists of two main components:

1. **Web Scraper**: Extracts detailed car information from PakWheels.com including specifications, variants, prices, and images
2. **Interactive Quiz Website**: Multiple quiz modes to test your knowledge of Pakistani cars with brand filtering and detailed results

---

## ✨ Features

### Scraper Features
- ✅ Scrapes car data from PakWheels.com (New, Upcoming, Discontinued)
- ✅ Extracts comprehensive specifications (Engine, Mileage, Transmission, Fuel Type, Body Type, etc.)
- ✅ Captures variant information with prices and links
- ✅ Saves data in organized JSON structure
- ✅ Comprehensive error handling and logging
- ✅ Asynchronous requests for better performance

### Quiz Website Features
- 🎮 **6 Different Quiz Modes**:
  - Home Page with overview
  - Quiz Challenge (9 comprehensive questions)
  - Brand Identifier (Image-based brand recognition)
  - Text Identifier (Brand identification without images)
  - Body Type Quiz (Brand + Body Type identification)
  - Complete Quiz (Brand + Body Type + Status)
  
- 🎯 **Interactive Features**:
  - Brand filtering with checkboxes
  - Discontinued car limit control
  - Progress tracking
  - Score display with percentages
  - Image reveals after answering
  - Clickable links to car details
  - Multiple choice for body types (when applicable)
  - Detailed results breakdown

---

## 📁 Project Structure

```
car/
├── scraper/
│   ├── carScraper.py          # Main scraper class
│   └── categories.txt         # List of car categories to scrape
├── interfaces/
│   └── base_scraper.py        # Base interface for scraper
├── utils/
│   ├── LoggerConstants.py     # Logging configuration constants
│   └── logging_config.json    # Logging settings
├── brands/                    # Generated brand JSON files
│   ├── honda.json
│   ├── toyota.json
│   └── ...
├── cars/                      # Generated detailed car specifications
│   ├── honda/
│   │   ├── city.json
│   │   ├── civic.json
│   │   └── ...
│   └── ...
├── website/
│   ├── index.html            # Main quiz page
│   ├── css/
│   │   └── styles.css        # Quiz styling
│   └── js/
│       ├── quiz.js           # Main quiz logic & Quiz Challenge
│       ├── brand-identifier.js    # Brand Identifier game
│       ├── text-identifier.js     # Text Identifier game
│       ├── bodytype-quiz.js       # Body Type Quiz game
│       └── complete-quiz.js       # Complete Quiz game
├── main.py                   # Scraper entry point
├── start_server.py           # Local HTTP server for quiz
├── requirements.txt          # Python dependencies
└── README.md                 # This file
```

---

## 🔧 Installation

### Prerequisites
- Python 3.8 or higher
- pip (Python package manager)
- Modern web browser (Chrome, Firefox, Edge, Safari)

### Setup Steps

1. **Clone or download the project**
   ```bash
   cd car
   ```

2. **Create a virtual environment (recommended)**
   ```bash
   python -m venv venv
   
   # Windows
   venv\Scripts\activate
   
   # macOS/Linux
   source venv/bin/activate
   ```

3. **Install Python dependencies**
   ```bash
   pip install -r requirements.txt
   ```

### Dependencies
The project uses the following Python packages:
- `aiohttp` - Asynchronous HTTP requests
- `beautifulsoup4` - HTML parsing
- `lxml` - XML/HTML parser
- `concurrent-log-handler` - Thread-safe logging

---

## 🚀 Usage

### Running the Scraper

The scraper extracts car data from PakWheels.com and saves it in JSON format.

```bash
# Activate virtual environment first
python main.py
```

**What it does:**
1. Reads categories from `scraper/categories.txt`
2. Scrapes car listings for each category (new, upcoming, discontinued)
3. Extracts detailed specifications for each car
4. Saves brand-level data in `brands/` folder
5. Saves individual car details in `cars/brand/model/` structure

**Output:**
- `brands/*.json` - Contains all cars for each brand with basic info
- `cars/brand/model.json` - Detailed specifications and variants for each car
- `logs/scraper.log` - Execution logs with rotation

**Scraper Configuration:**
- Categories to scrape: Edit `scraper/categories.txt`
- Logging settings: Configure in `utils/logging_config.json`
- Base URL: `https://www.pakwheels.com/`

---

### Running the Quiz Website

The quiz website requires a local server due to CORS restrictions when loading JSON files.

```bash
# Start the local HTTP server
python start_server.py
```

Then open your browser and navigate to:
```
http://localhost:8000/website/
```

**Important:** Keep the server running while using the quiz website.

---

## 🎮 Quiz Tabs

### 1. **Home Tab**
- Welcome page with project overview
- Instructions for getting started

### 2. **Quiz Challenge**
Comprehensive 9-question quiz covering:
- ❓ Brand identification
- 💰 Price range
- 🖼️ Image recognition
- 🚗 Body type
- 🔧 Engine displacement (CC)
- 📊 Status (New/Upcoming/Discontinued)
- ⛽ Mileage
- ⚡ Fuel type
- ⚙️ Transmission type

Shows variants with prices after submission.

### 3. **Brand Identifier**
- Image-based brand recognition game
- Brand filtering with checkboxes
- Discontinued car limit control
- Score tracking
- Multiple choice selection

### 4. **Text Identifier**
- Brand identification without images
- Shows: Price range, Status, Reviews, CC, Body Type, Mileage
- Progress counter (Answered/Remaining)
- Image and link revealed after answering
- Brand filtering support

### 5. **Body Type Quiz**
Two questions per car:
1. Which brand does this car belong to?
2. What is the body type? (Multiple selection with checkboxes)

**Features:**
- Multiple body type selection (e.g., "Compact sedan, Sedan")
- Color-coded feedback:
  - 🟢 Green: Correct selection
  - 🔴 Red: Wrong selection
  - 🟠 Orange: Missed correct answer
- Verify button to confirm body type selections
- Shows hints: Price, Status, Reviews, CC, Mileage
- Image and link appear after both answers

### 6. **Complete Quiz**
Three questions per car:
1. Which brand?
2. What body type? (Multiple selection)
3. What status? (New/Upcoming/Discontinued)

**Scoring:**
- 3 points per car (1 per correct answer)
- Detailed results breakdown
- Full feedback with color-coded selections

---

## 📊 Data Structure

### Brand JSON (`brands/brand.json`)
```json
{
  "new_cars": [
    {
      "name": "Honda City",
      "model": "City",
      "image": "https://...",
      "price_range": "PKR 47.37 - 61.49 lacs",
      "reviews": 476,
      "link": "https://..."
    }
  ],
  "upcoming_cars": [...],
  "discontinued_cars": [...]
}
```

### Car Details JSON (`cars/brand/model.json`)
```json
{
  "name": "Honda City",
  "brand": "Honda",
  "model": "City",
  "status": "new",
  "image": "https://...",
  "price_range": "PKR 47.37 - 61.49 lacs",
  "reviews": 476,
  "link": "https://...",
  "specifications": {
    "Price": "PKR 47.37 - 61.49 lacs",
    "Body Type": "Compact sedan,Sedan",
    "Displacement": "1199 - 1497 cc",
    "Transmission": "Manual & Automatic",
    "Mileage": "12 - 16 KM/L",
    "Fuel Type": "Petrol",
    ...
  },
  "variants": [
    {
      "name": "Honda City 1.2L CVT",
      "price": "PKR 4,737,000",
      "link": "https://..."
    }
  ]
}
```

---

## 💻 Technologies Used

### Backend (Scraper)
- **Python 3.13**
- **aiohttp** - Async HTTP client
- **BeautifulSoup4** - HTML parsing
- **lxml** - Fast XML/HTML parser
- **concurrent-log-handler** - Thread-safe logging with rotation

### Frontend (Quiz)
- **HTML5** - Structure
- **CSS3** - Styling with gradients and animations
- **JavaScript (ES6+)** - Interactive functionality
- **Fetch API** - Loading JSON data

### Design Features
- Responsive grid layouts
- Gradient backgrounds
- Hover effects
- Tab-based navigation
- Color-coded feedback
- Progress tracking

---

## ⚙️ Configuration

### Scraper Settings

**Edit `scraper/categories.txt`** to add/remove car categories:
```
new-cars
upcoming-cars
discontinued-cars
```

**Edit `utils/logging_config.json`** for logging configuration:
```json
{
  "log_file": "logs/scraper.log",
  "max_bytes": 10485760,
  "backup_count": 5,
  "log_level": "INFO"
}
```

### Quiz Settings

**Brand Filtering:**
- Select brands from checkboxes
- "Select All" / "Deselect All" toggle
- Minimum 1 brand required

**Discontinued Car Limit:**
- Default: 20 cars per brand
- Range: 0-100
- Applied independently to each selected brand

### Body Type Options
Available body types in quizzes:
- Sedan
- Compact sedan
- Hatchback
- SUV
- Crossover
- Micro Van
- Mini Van
- Van
- MPV
- Coupe
- Convertible
- Pick Up
- Station Wagon

---

## 🐛 Troubleshooting

### Scraper Issues

**Problem:** "FileNotFoundError: categories.txt"
- **Solution:** Ensure `scraper/categories.txt` exists with valid categories

**Problem:** Empty specifications or variants
- **Solution:** Check internet connection and PakWheels.com availability
- The scraper has error handling to continue even if individual cars fail

**Problem:** Logs folder error
- **Solution:** Create `logs/` folder manually: `mkdir logs`

### Quiz Issues

**Problem:** Cars not loading / CORS errors
- **Solution:** Use `python start_server.py` instead of opening `index.html` directly

**Problem:** Images not displaying
- **Solution:** Check internet connection (images loaded from PakWheels CDN)

**Problem:** Body types not matching
- **Solution:** Re-run scraper to get latest data with proper body type formatting

---

## 📝 Notes

- **Data Source:** All car data is scraped from PakWheels.com
- **Updates:** Re-run the scraper periodically to get latest car information
- **Browser Compatibility:** Works best on modern browsers (Chrome, Firefox, Edge, Safari)
- **Local Only:** Quiz runs on localhost; deploy to a web server for public access

---

## 🎯 Future Enhancements

Potential improvements:
- Database integration (PostgreSQL/MongoDB)
- User accounts and progress tracking
- Leaderboard system
- More quiz modes (price guessing, specification matching)
- Export results to PDF
- Mobile app version
- Real-time data updates
- API for third-party integrations

---

## 📄 License

This project is for educational purposes. All car data belongs to PakWheels.com and respective manufacturers.

---

## 🤝 Contributing

To contribute to this project:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

## 📧 Contact

For questions, issues, or suggestions, please create an issue in the repository.

---

**Happy Learning! 🚗📚**
