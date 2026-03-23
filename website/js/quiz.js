// Global variables
let allCars = [];
let filteredCars = [];
let selectedBrands = [];
let currentQuizData = null;
let userAnswers = {};

// Tab switching functionality
document.addEventListener('DOMContentLoaded', function() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const targetTab = this.getAttribute('data-tab');
            
            // Remove active class from all tabs and contents
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            // Add active class to clicked tab and corresponding content
            this.classList.add('active');
            document.getElementById(targetTab).classList.add('active');
        });
    });

    // Load car data when page loads
    loadCarData();
});

// Load car data from JSON files
async function loadCarData() {
    const loadingElement = document.querySelector('.loading');
    if (loadingElement) {
        loadingElement.textContent = 'Loading car data from brands folder...';
    }
    
    try {
        const brands = ['suzuki', 'toyota', 'honda', 'kia', 'hyundai', 'changan', 'mg', 'bmw', 'audi'];
        let loadedCount = 0;
        
        for (const brand of brands) {
            try {
                if (loadingElement) {
                    loadingElement.textContent = `Loading ${brand}... (${loadedCount + 1}/${brands.length})`;
                }
                
                const response = await fetch(`../brands/${brand}.json`);
                if (response.ok) {
                    const data = await response.json();
                    
                    // Add all new cars with status marker
                    if (data.new_cars && data.new_cars.length > 0) {
                        allCars.push(...data.new_cars.map(car => ({...car, brand: brand, status: 'new'})));
                    }
                    
                    // Add all upcoming cars with status marker
                    if (data.upcoming_cars && data.upcoming_cars.length > 0) {
                        allCars.push(...data.upcoming_cars.map(car => ({...car, brand: brand, status: 'upcoming'})));
                    }
                    
                    // Add ALL discontinued cars with status marker (filter will be applied in games)
                    if (data.discontinued_cars && data.discontinued_cars.length > 0) {
                        allCars.push(...data.discontinued_cars.map(car => ({...car, brand: brand, status: 'discontinued'})));
                    }
                    loadedCount++;
                } else {
                    console.warn(`Failed to load ${brand}: HTTP ${response.status}`);
                }
            } catch (error) {
                console.error(`Error loading ${brand}:`, error);
                
                // If first brand fails, likely CORS issue
                if (loadedCount === 0 && brand === 'suzuki') {
                    if (loadingElement) {
                        loadingElement.innerHTML = `
                            <div style="color: #f44336; padding: 20px;">
                                <h3>⚠️ Cannot Load Car Data</h3>
                                <p>Please run the website using a local server to avoid CORS restrictions.</p>
                                <p style="margin-top: 15px;"><strong>Solution:</strong></p>
                                <ol style="text-align: left; max-width: 500px; margin: 20px auto;">
                                    <li>Open Command Prompt/PowerShell</li>
                                    <li>Navigate to: <code>C:\\Users\\vines\\Desktop\\car</code></li>
                                    <li>Run: <code style="background: #f5f5f5; padding: 5px;">python start_server.py</code></li>
                                    <li>Open browser to: <code style="background: #f5f5f5; padding: 5px;">http://localhost:8000/website/</code></li>
                                </ol>
                            </div>
                        `;
                    }
                    return;
                }
            }
        }
        
        console.log(`✓ Successfully loaded ${allCars.length} cars from ${loadedCount} brands`);
        
        if (loadingElement) {
            if (allCars.length > 0) {
                loadingElement.innerHTML = `<div style="color: #4caf50;">✓ Loaded ${allCars.length} cars! Ready to start.</div>`;
            } else {
                loadingElement.innerHTML = `<div style="color: #f44336;">No cars loaded. Please check the brands folder.</div>`;
            }
        }
        
        // Populate brand filter checkboxes
        populateBrandFilter();
    } catch (error) {
        console.error('Fatal error loading car data:', error);
        if (loadingElement) {
            loadingElement.innerHTML = `<div style="color: #f44336;">Error: ${error.message}</div>`;
        }
    }
}

// Populate brand filter checkboxes
function populateBrandFilter() {
    const brandCheckboxesContainer = document.getElementById('brand-checkboxes');
    if (!brandCheckboxesContainer) return;
    
    // Get unique brands from loaded cars
    const brands = [...new Set(allCars.map(car => car.brand))];
    brands.sort();
    
    if (brands.length === 0) {
        brandCheckboxesContainer.innerHTML = '<p style="color: #666;">No brands available</p>';
        return;
    }
    
    brandCheckboxesContainer.innerHTML = brands.map(brand => `
        <label class="brand-checkbox-label">
            <input type="checkbox" class="brand-filter-checkbox" value="${brand}" checked onchange="updateSelectedBrands()">
            <span>${brand.charAt(0).toUpperCase() + brand.slice(1)}</span>
        </label>
    `).join('');
    
    // Initialize all brands as selected
    selectedBrands = [...brands];
    filteredCars = [...allCars];
}

// Update selected brands
function updateSelectedBrands() {
    const checkboxes = document.querySelectorAll('.brand-filter-checkbox');
    selectedBrands = Array.from(checkboxes)
        .filter(cb => cb.checked)
        .map(cb => cb.value);
    
    filteredCars = allCars.filter(car => selectedBrands.includes(car.brand));
    
    const applyBtn = document.querySelector('.apply-filter-btn');
    if (applyBtn) {
        applyBtn.disabled = selectedBrands.length === 0;
        applyBtn.textContent = selectedBrands.length === 0 
            ? 'Please select at least one brand'
            : `Start Quiz with ${selectedBrands.length} Brand${selectedBrands.length > 1 ? 's' : ''} (${filteredCars.length} cars) 🎯`;
    }
}

// Toggle all brands
function toggleAllBrands() {
    const checkboxes = document.querySelectorAll('.brand-filter-checkbox');
    const allChecked = Array.from(checkboxes).every(cb => cb.checked);
    
    checkboxes.forEach(cb => {
        cb.checked = !allChecked;
    });
    
    updateSelectedBrands();
    
    const btn = document.querySelector('.select-all-btn');
    if (btn) {
        btn.textContent = allChecked ? 'Select All' : 'Deselect All';
    }
}

// Apply filter and start quiz
function applyFilterAndStartQuiz() {
    if (selectedBrands.length === 0) {
        alert('Please select at least one brand!');
        return;
    }
    
    if (filteredCars.length === 0) {
        alert('No cars available for selected brands!');
        return;
    }
    
    // Hide filter, show quiz
    document.getElementById('brand-filter').style.display = 'none';
    document.getElementById('quiz-container').style.display = 'block';
    
    // Generate quiz
    generateQuiz();
}

// Start the quiz
function startQuiz() {
    if (allCars.length === 0) {
        alert('Please wait, car data is still loading...\n\nIf this persists, please run the website using a local server (see console for instructions).');
        setTimeout(loadCarData, 100);
        return;
    }
    
    // Switch to quiz tab
    document.querySelector('[data-tab="quiz"]').click();
    
    // Show filter section
    document.getElementById('brand-filter').style.display = 'block';
    document.getElementById('quiz-container').style.display = 'none';
    
    // Update selected brands count
    updateSelectedBrands();
}

// Generate quiz questions
async function generateQuiz() {
    // Select a random car from filtered cars
    const randomCar = filteredCars[Math.floor(Math.random() * filteredCars.length)];
    currentQuizData = randomCar;
    userAnswers = {};
    
    const quizContainer = document.getElementById('quiz-container');
    
    // Show loading
    quizContainer.innerHTML = '<div class="loading">Generating quiz questions...</div>';
    
    // Get unique brands from FILTERED cars only (selected brands)
    const filteredBrands = [...new Set(filteredCars.map(car => car.brand))];
    
    // Generate price ranges from filtered cars
    const priceRanges = generatePriceRanges(randomCar.price_range);
    
    // Get random images from filtered cars only (1 correct + 9 random)
    const images = getRandomImages(randomCar.image);
    
    // Generate body types from filtered cars
    const bodyTypes = await getBodyTypesFromFilteredCars();
    
    // Generate CC options from filtered cars
    const ccOptions = await getCCOptionsFromFilteredCars();
    
    // Generate mileage options from filtered cars
    const mileageOptions = await getMileageOptionsFromFilteredCars();
    
    // Generate fuel type options from filtered cars
    const fuelTypeOptions = await getFuelTypeOptionsFromFilteredCars();
    
    // Generate transmission options from filtered cars
    const transmissionOptions = await getTransmissionOptionsFromFilteredCars();
    
    let html = `
        <div class="car-model-display">
            <h2>${randomCar.model}</h2>
            <p style="margin-top: 10px; font-size: 1.2em;">Answer all questions about this car!</p>
        </div>
        
        <!-- Question 1: Brand -->
        <div class="question-card">
            <div class="question-title">1. Which brand does this car belong to?</div>
            <div class="options-grid">
                ${filteredBrands.map(brand => `
                    <label class="option-label">
                        <input type="checkbox" name="brand" value="${brand}" onchange="handleSingleChoice('brand', this)">
                        <span>${brand.charAt(0).toUpperCase() + brand.slice(1)}</span>
                    </label>
                `).join('')}
            </div>
        </div>
        
        <!-- Question 2: Price Range -->
        <div class="question-card">
            <div class="question-title">2. What is the price range of this car?</div>
            <div class="options-grid">
                ${priceRanges.map(range => `
                    <label class="option-label">
                        <input type="checkbox" name="price" value="${range}" onchange="handleSingleChoice('price', this)">
                        <span>${range}</span>
                    </label>
                `).join('')}
            </div>
        </div>
        
        <!-- Question 3: Correct Image -->
        <div class="question-card">
            <div class="question-title">3. Which is the correct image of this car?</div>
            <div class="image-grid">
                ${images.map((img, idx) => `
                    <div class="image-option" id="img-${idx}">
                        <input type="checkbox" name="image" value="${img}" onchange="handleSingleChoice('image', this)">
                        <img src="${img}" alt="Car ${idx + 1}" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22100%22%3E%3Crect fill=%22%23ddd%22 width=%22200%22 height=%22100%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22%23999%22%3ECar ${idx + 1}%3C/text%3E%3C/svg%3E'">
                    </div>
                `).join('')}
            </div>
        </div>
        
        <!-- Question 4: Body Type -->
        <div class="question-card">
            <div class="question-title">4. What is the body type of this car?</div>
            <div class="options-grid">
                ${bodyTypes.map(type => `
                    <label class="option-label">
                        <input type="checkbox" name="bodytype" value="${type}" onchange="handleSingleChoice('bodytype', this)">
                        <span>${type}</span>
                    </label>
                `).join('')}
            </div>
        </div>
        
        <!-- Question 5: Engine Displacement -->
        <div class="question-card">
            <div class="question-title">5. What is the engine displacement (CC) of this car?</div>
            <div class="options-grid">
                ${ccOptions.map(cc => `
                    <label class="option-label">
                        <input type="checkbox" name="cc" value="${cc}" onchange="handleSingleChoice('cc', this)">
                        <span>${cc}</span>
                    </label>
                `).join('')}
            </div>
        </div>
        
        <!-- Question 6: Car Status -->
        <div class="question-card">
            <div class="question-title">6. What is the status of this car?</div>
            <div class="options-grid">
                <label class="option-label">
                    <input type="checkbox" name="status" value="new" onchange="handleSingleChoice('status', this)">
                    <span>New</span>
                </label>
                <label class="option-label">
                    <input type="checkbox" name="status" value="upcoming" onchange="handleSingleChoice('status', this)">
                    <span>Upcoming</span>
                </label>
                <label class="option-label">
                    <input type="checkbox" name="status" value="discontinued" onchange="handleSingleChoice('status', this)">
                    <span>Discontinued</span>
                </label>
            </div>
        </div>
        
        <!-- Question 7: Mileage -->
        <div class="question-card">
            <div class="question-title">7. What is the mileage of this car?</div>
            <div class="options-grid">
                ${mileageOptions.map(m => `
                    <label class="option-label">
                        <input type="checkbox" name="mileage" value="${m}" onchange="handleSingleChoice('mileage', this)">
                        <span>${m}</span>
                    </label>
                `).join('')}
            </div>
        </div>
        
        <!-- Question 8: Fuel Type -->
        <div class="question-card">
            <div class="question-title">8. What is the fuel type of this car?</div>
            <div class="options-grid">
                ${fuelTypeOptions.map(f => `
                    <label class="option-label">
                        <input type="checkbox" name="fueltype" value="${f}" onchange="handleSingleChoice('fueltype', this)">
                        <span>${f}</span>
                    </label>
                `).join('')}
            </div>
        </div>
        
        <!-- Question 9: Transmission -->
        <div class="question-card">
            <div class="question-title">9. What is the transmission type of this car?</div>
            <div class="options-grid">
                ${transmissionOptions.map(t => `
                    <label class="option-label">
                        <input type="checkbox" name="transmission" value="${t}" onchange="handleSingleChoice('transmission', this)">
                        <span>${t}</span>
                    </label>
                `).join('')}
            </div>
        </div>
    `;
    
    quizContainer.innerHTML = html;
    document.getElementById('submit-quiz').style.display = 'block';
    
    // Add submit event listener
    document.getElementById('submit-quiz').onclick = submitQuiz;
}

// Handle single choice checkboxes (only one can be selected)
function handleSingleChoice(questionName, checkbox) {
    const checkboxes = document.querySelectorAll(`input[name="${questionName}"]`);
    checkboxes.forEach(cb => {
        if (cb !== checkbox) {
            cb.checked = false;
        }
    });
    
    userAnswers[questionName] = checkbox.checked ? checkbox.value : null;
}

// Generate price ranges with correct one included (from filtered cars only)
function generatePriceRanges(correctPrice) {
    const ranges = [correctPrice];
    
    // Get actual price ranges from filtered cars
    const filteredPriceRanges = [...new Set(filteredCars
        .map(car => car.price_range)
        .filter(price => price && price !== correctPrice)
    )];
    
    // Shuffle and take up to 5 more
    const shuffled = filteredPriceRanges.sort(() => Math.random() - 0.5);
    for (let i = 0; i < 5 && i < shuffled.length; i++) {
        ranges.push(shuffled[i]);
    }
    
    // If we still need more options, generate some generic ones
    const possibleRanges = [
        'PKR 15.00 - 20.00 lacs',
        'PKR 20.00 - 30.00 lacs',
        'PKR 30.00 - 40.00 lacs',
        'PKR 40.00 - 50.00 lacs',
        'PKR 50.00 - 70.00 lacs',
        'PKR 70.00 - 1.00 crore',
        'PKR 1.00 - 1.50 crore',
        'PKR 1.50 - 2.00 crore'
    ];
    
    while (ranges.length < 6) {
        const randomRange = possibleRanges[Math.floor(Math.random() * possibleRanges.length)];
        if (!ranges.includes(randomRange)) {
            ranges.push(randomRange);
        }
    }
    
    // Shuffle ranges
    return ranges.sort(() => Math.random() - 0.5);
}

// Get random images (1 correct + 9 random from filtered cars only)
function getRandomImages(correctImage) {
    const images = [correctImage];
    
    // Get 9 random car images from OTHER FILTERED cars
    const otherFilteredCars = filteredCars.filter(car => car.image !== correctImage);
    const shuffled = otherFilteredCars.sort(() => Math.random() - 0.5);
    
    for (let i = 0; i < 9 && i < shuffled.length; i++) {
        if (shuffled[i].image) {
            images.push(shuffled[i].image);
        }
    }
    
    // Fill with placeholder if not enough
    while (images.length < 10) {
        images.push(`data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='100'%3E%3Crect fill='%23ddd' width='200' height='100'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%23999'%3ECar ${images.length}%3C/text%3E%3C/svg%3E`);
    }
    
    // Shuffle images
    return images.sort(() => Math.random() - 0.5);
}

// Get body types from filtered cars
async function getBodyTypesFromFilteredCars() {
    const bodyTypes = new Set();
    
    // Try to get body types from car detail files
    for (const car of filteredCars.slice(0, 20)) { // Check first 20 filtered cars
        try {
            const response = await fetch(`../cars/${car.brand}/${car.model.toLowerCase().replace(/ /g, '_')}.json`);
            if (response.ok) {
                const data = await response.json();
                if (data.specifications && data.specifications['Body Type']) {
                    bodyTypes.add(data.specifications['Body Type']);
                }
            }
        } catch (error) {
            // Skip if can't load
        }
    }
    
    // If we found body types from filtered cars, use them
    const bodyTypesArray = Array.from(bodyTypes);
    
    // Add common fallback types if needed
    const commonTypes = ['Sedan', 'Hatchback', 'SUV', 'Crossover', 'Micro Van', 'MPV'];
    commonTypes.forEach(type => {
        if (!bodyTypesArray.includes(type) && bodyTypesArray.length < 8) {
            bodyTypesArray.push(type);
        }
    });
    
    return bodyTypesArray.slice(0, 8); // Return max 8 options
}

// Get CC options from filtered cars
async function getCCOptionsFromFilteredCars() {
    const ccValues = new Set();
    
    // Try to get CC values from car detail files
    for (const car of filteredCars.slice(0, 20)) { // Check first 20 filtered cars
        try {
            const response = await fetch(`../cars/${car.brand}/${car.model.toLowerCase().replace(/ /g, '_')}.json`);
            if (response.ok) {
                const data = await response.json();
                if (data.specifications && data.specifications['Displacement']) {
                    ccValues.add(data.specifications['Displacement']);
                }
            }
        } catch (error) {
            // Skip if can't load
        }
    }
    
    // If we found CC values from filtered cars, use them
    const ccArray = Array.from(ccValues);
    
    // Add common fallback values if needed
    const commonCC = ['660 cc', '800 cc', '998 cc', '1000 cc', '1200 cc', '1300 cc', '1500 cc', '1800 cc', '2000 cc'];
    commonCC.forEach(cc => {
        if (!ccArray.includes(cc) && ccArray.length < 10) {
            ccArray.push(cc);
        }
    });
    
    return ccArray.slice(0, 10); // Return max 10 options
}

// Get mileage options from filtered cars
async function getMileageOptionsFromFilteredCars() {
    const mileageValues = new Set();
    
    for (const car of filteredCars.slice(0, 20)) {
        try {
            const response = await fetch(`../cars/${car.brand}/${car.model.toLowerCase().replace(/ /g, '_')}.json`);
            if (response.ok) {
                const data = await response.json();
                if (data.specifications && data.specifications['Mileage']) {
                    mileageValues.add(data.specifications['Mileage']);
                }
            }
        } catch (error) {
            // Skip if can't load
        }
    }
    
    const mileageArray = Array.from(mileageValues);
    const commonMileage = ['10 - 12 KM/L', '12 - 14 KM/L', '14 - 16 KM/L', '16 - 18 KM/L', '18 - 20 KM/L', '20 - 25 KM/L'];
    commonMileage.forEach(m => {
        if (!mileageArray.includes(m) && mileageArray.length < 8) {
            mileageArray.push(m);
        }
    });
    
    return mileageArray.slice(0, 8);
}

// Get fuel type options from filtered cars
async function getFuelTypeOptionsFromFilteredCars() {
    const fuelTypes = new Set();
    
    for (const car of filteredCars.slice(0, 20)) {
        try {
            const response = await fetch(`../cars/${car.brand}/${car.model.toLowerCase().replace(/ /g, '_')}.json`);
            if (response.ok) {
                const data = await response.json();
                if (data.specifications && data.specifications['Fuel Type']) {
                    fuelTypes.add(data.specifications['Fuel Type']);
                }
            }
        } catch (error) {
            // Skip if can't load
        }
    }
    
    const fuelArray = Array.from(fuelTypes);
    const commonFuels = ['Petrol', 'Diesel', 'Hybrid', 'Electric', 'CNG'];
    commonFuels.forEach(f => {
        if (!fuelArray.includes(f) && fuelArray.length < 6) {
            fuelArray.push(f);
        }
    });
    
    return fuelArray.slice(0, 6);
}

// Get transmission options from filtered cars
async function getTransmissionOptionsFromFilteredCars() {
    const transmissions = new Set();
    
    for (const car of filteredCars.slice(0, 20)) {
        try {
            const response = await fetch(`../cars/${car.brand}/${car.model.toLowerCase().replace(/ /g, '_')}.json`);
            if (response.ok) {
                const data = await response.json();
                if (data.specifications && data.specifications['Transmission']) {
                    transmissions.add(data.specifications['Transmission']);
                }
            }
        } catch (error) {
            // Skip if can't load
        }
    }
    
    const transArray = Array.from(transmissions);
    const commonTrans = ['Manual', 'Automatic', 'Manual & Automatic', 'CVT', 'DCT'];
    commonTrans.forEach(t => {
        if (!transArray.includes(t) && transArray.length < 6) {
            transArray.push(t);
        }
    });
    
    return transArray.slice(0, 6);
}

// Submit quiz and show results
async function submitQuiz() {
    const car = currentQuizData;
    let score = 0;
    const totalQuestions = 9;
    const results = [];
    
    // Load detailed car data to get body type and CC
    let carDetails = null;
    try {
        const response = await fetch(`../cars/${car.brand}/${car.model.toLowerCase().replace(/ /g, '_')}.json`);
        if (response.ok) {
            carDetails = await response.json();
        }
    } catch (error) {
        console.warn('Could not load car details:', error);
    }
    
    // Check answers
    
    // 1. Brand
    const correctBrand = car.brand;
    const userBrand = userAnswers.brand;
    const brandCorrect = userBrand === correctBrand;
    if (brandCorrect) score++;
    results.push({
        question: 'Brand',
        correct: brandCorrect,
        userAnswer: userBrand ? userBrand.charAt(0).toUpperCase() + userBrand.slice(1) : 'Not answered',
        correctAnswer: correctBrand.charAt(0).toUpperCase() + correctBrand.slice(1)
    });
    
    // 2. Price Range
    const correctPrice = car.price_range;
    const userPrice = userAnswers.price;
    const priceCorrect = userPrice === correctPrice;
    if (priceCorrect) score++;
    results.push({
        question: 'Price Range',
        correct: priceCorrect,
        userAnswer: userPrice || 'Not answered',
        correctAnswer: correctPrice
    });
    
    // 3. Image
    const correctImage = car.image;
    const userImage = userAnswers.image;
    const imageCorrect = userImage === correctImage;
    if (imageCorrect) score++;
    results.push({
        question: 'Correct Image',
        correct: imageCorrect,
        userAnswer: userImage || null,
        correctAnswer: correctImage,
        isImage: true
    });
    
    // 4. Body Type
    let bodyType = 'Unknown';
    if (carDetails && carDetails.specifications && carDetails.specifications['Body Type']) {
        bodyType = carDetails.specifications['Body Type'];
    }
    const userBodyType = userAnswers.bodytype;
    const bodyTypeCorrect = userBodyType === bodyType;
    if (bodyTypeCorrect) score++;
    results.push({
        question: 'Body Type',
        correct: bodyTypeCorrect,
        userAnswer: userBodyType || 'Not answered',
        correctAnswer: bodyType
    });
    
    // 5. Engine CC
    let engineCC = 'Unknown';
    if (carDetails && carDetails.specifications && carDetails.specifications['Displacement']) {
        engineCC = carDetails.specifications['Displacement'];
    }
    const userCC = userAnswers.cc;
    const ccCorrect = userCC === engineCC;
    if (ccCorrect) score++;
    results.push({
        question: 'Engine Displacement',
        correct: ccCorrect,
        userAnswer: userCC || 'Not answered',
        correctAnswer: engineCC
    });
    
    // 6. Car Status
    let carStatus = 'Unknown';
    if (carDetails && carDetails.status) {
        carStatus = carDetails.status;
    }
    const userStatus = userAnswers.status;
    const statusCorrect = userStatus === carStatus;
    if (statusCorrect) score++;
    results.push({
        question: 'Car Status',
        correct: statusCorrect,
        userAnswer: userStatus ? userStatus.charAt(0).toUpperCase() + userStatus.slice(1) : 'Not answered',
        correctAnswer: carStatus.charAt(0).toUpperCase() + carStatus.slice(1)
    });
    
    // 7. Mileage
    let mileage = 'Unknown';
    if (carDetails && carDetails.specifications && carDetails.specifications['Mileage']) {
        mileage = carDetails.specifications['Mileage'];
    }
    const userMileage = userAnswers.mileage;
    const mileageCorrect = userMileage === mileage;
    if (mileageCorrect) score++;
    results.push({
        question: 'Mileage',
        correct: mileageCorrect,
        userAnswer: userMileage || 'Not answered',
        correctAnswer: mileage
    });
    
    // 8. Fuel Type
    let fuelType = 'Unknown';
    if (carDetails && carDetails.specifications && carDetails.specifications['Fuel Type']) {
        fuelType = carDetails.specifications['Fuel Type'];
    }
    const userFuelType = userAnswers.fueltype;
    const fuelTypeCorrect = userFuelType === fuelType;
    if (fuelTypeCorrect) score++;
    results.push({
        question: 'Fuel Type',
        correct: fuelTypeCorrect,
        userAnswer: userFuelType || 'Not answered',
        correctAnswer: fuelType
    });
    
    // 9. Transmission
    let transmission = 'Unknown';
    if (carDetails && carDetails.specifications && carDetails.specifications['Transmission']) {
        transmission = carDetails.specifications['Transmission'];
    }
    const userTransmission = userAnswers.transmission;
    const transmissionCorrect = userTransmission === transmission;
    if (transmissionCorrect) score++;
    results.push({
        question: 'Transmission',
        correct: transmissionCorrect,
        userAnswer: userTransmission || 'Not answered',
        correctAnswer: transmission
    });
    
    // Highlight correct/incorrect answers
    highlightAnswers(results, car.image);
    
    // Show results with variants
    displayResults(score, totalQuestions, results, car, carDetails);
}

// Highlight correct and incorrect answers
function highlightAnswers(results, correctImage) {
    // Brand
    const brandInputs = document.querySelectorAll('input[name="brand"]');
    brandInputs.forEach(input => {
        const label = input.parentElement;
        if (input.value === results[0].correctAnswer.toLowerCase()) {
            label.classList.add('correct');
        } else if (input.checked) {
            label.classList.add('incorrect');
        }
    });
    
    // Price
    const priceInputs = document.querySelectorAll('input[name="price"]');
    priceInputs.forEach(input => {
        const label = input.parentElement;
        if (input.value === results[1].correctAnswer) {
            label.classList.add('correct');
        } else if (input.checked) {
            label.classList.add('incorrect');
        }
    });
    
    // Image
    const imageInputs = document.querySelectorAll('input[name="image"]');
    imageInputs.forEach(input => {
        const imageOption = input.parentElement;
        if (input.value === correctImage) {
            imageOption.classList.add('correct');
        } else if (input.checked) {
            imageOption.classList.add('incorrect');
        }
    });
    
    // Body Type
    const bodyTypeInputs = document.querySelectorAll('input[name="bodytype"]');
    bodyTypeInputs.forEach(input => {
        const label = input.parentElement;
        if (input.value === results[3].correctAnswer) {
            label.classList.add('correct');
        } else if (input.checked) {
            label.classList.add('incorrect');
        }
    });
    
    // CC
    const ccInputs = document.querySelectorAll('input[name="cc"]');
    ccInputs.forEach(input => {
        const label = input.parentElement;
        if (input.value === results[4].correctAnswer) {
            label.classList.add('correct');
        } else if (input.checked) {
            label.classList.add('incorrect');
        }
    });
    
    // Status
    const statusInputs = document.querySelectorAll('input[name="status"]');
    statusInputs.forEach(input => {
        const label = input.parentElement;
        if (input.value === results[5].correctAnswer.toLowerCase()) {
            label.classList.add('correct');
        } else if (input.checked) {
            label.classList.add('incorrect');
        }
    });
    
    // Mileage
    const mileageInputs = document.querySelectorAll('input[name="mileage"]');
    mileageInputs.forEach(input => {
        const label = input.parentElement;
        if (input.value === results[6].correctAnswer) {
            label.classList.add('correct');
        } else if (input.checked) {
            label.classList.add('incorrect');
        }
    });
    
    // Fuel Type
    const fuelTypeInputs = document.querySelectorAll('input[name="fueltype"]');
    fuelTypeInputs.forEach(input => {
        const label = input.parentElement;
        if (input.value === results[7].correctAnswer) {
            label.classList.add('correct');
        } else if (input.checked) {
            label.classList.add('incorrect');
        }
    });
    
    // Transmission
    const transmissionInputs = document.querySelectorAll('input[name="transmission"]');
    transmissionInputs.forEach(input => {
        const label = input.parentElement;
        if (input.value === results[8].correctAnswer) {
            label.classList.add('correct');
        } else if (input.checked) {
            label.classList.add('incorrect');
        }
    });
}

// Display results
function displayResults(score, total, results, car, carDetails) {
    const percentage = Math.round((score / total) * 100);
    let emoji = '🎉';
    let message = 'Excellent!';
    
    if (percentage < 40) {
        emoji = '😢';
        message = 'Keep practicing!';
    } else if (percentage < 70) {
        emoji = '😊';
        message = 'Good effort!';
    } else if (percentage < 100) {
        emoji = '👏';
        message = 'Great job!';
    }
    
    const resultsContent = document.getElementById('results-content');
    
    // Build variants HTML
    let variantsHTML = '';
    if (carDetails && carDetails.variants && carDetails.variants.length > 0) {
        variantsHTML = `
            <div class="variants-section" style="margin-top: 30px; background: #f8f9fa; padding: 25px; border-radius: 15px;">
                <h3 style="color: #333; margin-bottom: 20px; font-size: 1.5em;">🚗 Available Variants (${carDetails.variants.length})</h3>
                ${carDetails.variants.map((variant, idx) => {
                    return `
                        <div class="variant-item" style="background: white; padding: 20px; margin-bottom: 15px; border-radius: 10px; border-left: 4px solid #667eea; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
                            <h4 style="color: #667eea; margin-bottom: 10px; font-size: 1.2em;">${idx + 1}. ${variant.name}</h4>
                            <p style="color: #28a745; font-weight: bold; font-size: 1.1em; margin: 10px 0;">💰 ${variant.price}</p>
                            ${variant.link ? `<a href="${variant.link}" target="_blank" style="color: #667eea; text-decoration: none; font-size: 0.95em; font-weight: 600;">🔗 View Details →</a>` : ''}
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }
    
    let html = `
        <div class="score-display">
            <h3>${emoji} ${score} / ${total}</h3>
            <p>${message} You scored ${percentage}%</p>
            <p style="margin-top: 15px; font-size: 0.9em;">Car: ${car.brand.charAt(0).toUpperCase() + car.brand.slice(1)} ${car.model}</p>
        </div>
        
        <div class="result-details">
            <h3 style="margin-bottom: 20px; color: #333;">Question Breakdown:</h3>
            ${results.map((result, idx) => {
                // Special handling for image question
                if (result.isImage) {
                    return `
                        <div class="result-item ${result.correct ? 'correct' : 'incorrect'}">
                            <h4>${idx + 1}. ${result.question} ${result.correct ? '✓' : '✗'}</h4>
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 15px;">
                                <div>
                                    <p style="margin-bottom: 10px;"><strong>Your Answer:</strong></p>
                                    ${result.userAnswer ? 
                                        `<img src="${result.userAnswer}" alt="Your selection" style="width: 100%; max-width: 200px; height: 120px; object-fit: cover; border-radius: 8px; border: 3px solid ${result.correct ? '#4caf50' : '#f44336'};" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22120%22%3E%3Crect fill=%22%23ddd%22 width=%22200%22 height=%22120%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22%23999%22%3EYour Choice%3C/text%3E%3C/svg%3E'">` 
                                        : '<p style="color: #999;">No answer selected</p>'}
                                </div>
                                <div>
                                    <p style="margin-bottom: 10px;"><strong>Correct Answer:</strong></p>
                                    <img src="${result.correctAnswer}" alt="Correct answer" style="width: 100%; max-width: 200px; height: 120px; object-fit: cover; border-radius: 8px; border: 3px solid #4caf50;" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22120%22%3E%3Crect fill=%22%23ddd%22 width=%22200%22 height=%22120%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22%23999%22%3ECorrect Image%3C/text%3E%3C/svg%3E'">
                                </div>
                            </div>
                        </div>
                    `;
                }
                // Regular text-based questions
                return `
                    <div class="result-item ${result.correct ? 'correct' : 'incorrect'}">
                        <h4>${idx + 1}. ${result.question} ${result.correct ? '✓' : '✗'}</h4>
                        <p><strong>Your Answer:</strong> ${result.userAnswer}</p>
                        <p><strong>Correct Answer:</strong> ${result.correctAnswer}</p>
                    </div>
                `;
            }).join('')}
        </div>
        
        ${variantsHTML}
        
        <button class="retake-btn" onclick="retakeQuiz()">Take Another Quiz 🔄</button>
    `;
    
    resultsContent.innerHTML = html;
    
    // Switch to results tab
    document.querySelector('[data-tab="results"]').click();
}

// Retake quiz
function retakeQuiz() {
    // Reset to filter selection
    document.querySelector('[data-tab="quiz"]').click();
    document.getElementById('brand-filter').style.display = 'block';
    document.getElementById('quiz-container').style.display = 'none';
    updateSelectedBrands();
}
