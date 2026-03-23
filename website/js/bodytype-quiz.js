// Body Type Quiz Variables
let bodyTypeQuizCars = [];
let selectedBrandsBodyType = [];
let currentBodyTypeCarIndex = 0;
let bodyTypeScore = 0;
let bodyTypeTotal = 0;
let bodyTypeResults = [];
let currentBodyTypeAnswers = { brand: null, bodyType: null };

// Populate brand checkboxes for body type quiz
function populateBrandBodyTypeFilter() {
    const container = document.getElementById('bodytype-checkboxes');
    if (!container || allCars.length === 0) return;
    
    const brands = [...new Set(allCars.map(car => car.brand))];
    brands.sort();
    
    container.innerHTML = brands.map(brand => `
        <label class="brand-checkbox-label">
            <input type="checkbox" class="bodytype-filter-checkbox" value="${brand}" checked onchange="updateBodyTypeBrandSelection()">
            <span>${brand.charAt(0).toUpperCase() + brand.slice(1)}</span>
        </label>
    `).join('');
    
    selectedBrandsBodyType = [...brands];
}

// Update selected brands for body type quiz
function updateBodyTypeBrandSelection() {
    const checkboxes = document.querySelectorAll('.bodytype-filter-checkbox');
    selectedBrandsBodyType = Array.from(checkboxes)
        .filter(cb => cb.checked)
        .map(cb => cb.value);
    
    const applyBtn = document.querySelector('#bodytype-filter .apply-filter-btn');
    if (applyBtn) {
        applyBtn.disabled = selectedBrandsBodyType.length === 0;
        applyBtn.textContent = selectedBrandsBodyType.length === 0 
            ? 'Please select at least one brand'
            : `Start with ${selectedBrandsBodyType.length} Brand${selectedBrandsBodyType.length > 1 ? 's' : ''} 🚗`;
    }
}

// Toggle all brands in body type quiz
function toggleAllBrandsBodyType() {
    const checkboxes = document.querySelectorAll('.bodytype-filter-checkbox');
    const allChecked = Array.from(checkboxes).every(cb => cb.checked);
    
    checkboxes.forEach(cb => {
        cb.checked = !allChecked;
    });
    
    updateBodyTypeBrandSelection();
    
    const btn = document.querySelector('#bodytype-filter .select-all-btn');
    if (btn) {
        btn.textContent = allChecked ? 'Select All' : 'Deselect All';
    }
}

// Start Body Type Quiz
function startBodyTypeQuiz() {
    if (selectedBrandsBodyType.length === 0) {
        alert('Please select at least one brand!');
        return;
    }
    
    const discontinuedLimitInput = document.getElementById('bodytype-discontinued-limit').value;
    const discontinuedLimit = parseInt(discontinuedLimitInput, 10);
    
    if (isNaN(discontinuedLimit) || discontinuedLimit < 0) {
        alert('Please enter a valid number for discontinued cars limit!');
        return;
    }
    
    console.log(`Starting Body Type Quiz with discontinued limit: ${discontinuedLimit} per brand`);
    
    // Filter cars by selected brands
    bodyTypeQuizCars = [];
    
    selectedBrandsBodyType.forEach(brand => {
        const brandCars = allCars.filter(car => car.brand === brand);
        
        const newCars = brandCars.filter(car => car.status === 'new');
        const upcomingCars = brandCars.filter(car => car.status === 'upcoming');
        const allDiscontinued = brandCars.filter(car => car.status === 'discontinued');
        const discontinuedCars = allDiscontinued.slice(0, discontinuedLimit);
        
        console.log(`${brand}: ${newCars.length} new, ${upcomingCars.length} upcoming, ${discontinuedCars.length} discontinued (limit: ${discontinuedLimit})`);
        
        bodyTypeQuizCars.push(...newCars, ...upcomingCars, ...discontinuedCars);
    });
    
    if (bodyTypeQuizCars.length === 0) {
        alert('No cars found for selected brands!');
        return;
    }
    
    // Shuffle cars
    bodyTypeQuizCars = bodyTypeQuizCars.sort(() => Math.random() - 0.5);
    
    // Reset game state
    currentBodyTypeCarIndex = 0;
    bodyTypeScore = 0;
    bodyTypeTotal = 0;
    bodyTypeResults = [];
    
    // Hide filter, show game
    document.getElementById('bodytype-filter').style.display = 'none';
    document.getElementById('bodytype-game').style.display = 'block';
    
    // Show first car
    showBodyTypeQuizCar();
}

// Show current car for body type quiz
async function showBodyTypeQuizCar() {
    if (currentBodyTypeCarIndex >= bodyTypeQuizCars.length) {
        finishBodyTypeQuiz();
        return;
    }
    
    const car = bodyTypeQuizCars[currentBodyTypeCarIndex];
    currentBodyTypeAnswers = { brand: null, bodyType: null };
    
    // Update progress counter
    const answered = bodyTypeTotal;
    const remaining = bodyTypeQuizCars.length - currentBodyTypeCarIndex;
    document.getElementById('bodytype-progress-counter').textContent = 
        `Answered: ${answered} / Remaining: ${remaining}`;
    
    // Hide image initially
    document.getElementById('bodytype-car-image-container').style.display = 'none';
    
    // Display car info
    document.getElementById('bodytype-car-display-name').textContent = car.model || car.name || 'Unknown Car';
    
    // Fetch car details for body type and additional info
    let carDetails = null;
    try {
        const response = await fetch(`../cars/${car.brand}/${(car.model || car.name).toLowerCase().replace(/ /g, '_')}.json`);
        if (response.ok) {
            carDetails = await response.json();
        }
    } catch (error) {
        // Skip if can't load
    }
    
    // Show hint
    let hint = '';
    if (car.price_range) hint += `💰 ${car.price_range}`;
    if (car.status) hint += ` • 📊 ${car.status.charAt(0).toUpperCase() + car.status.slice(1)}`;
    if (car.reviews !== undefined) hint += ` • ⭐ ${car.reviews} reviews`;
    if (carDetails && carDetails.specifications) {
        if (carDetails.specifications['Displacement']) hint += ` • 🔧 ${carDetails.specifications['Displacement']}`;
        if (carDetails.specifications['Mileage']) hint += ` • ⛽ ${carDetails.specifications['Mileage']}`;
    }
    document.getElementById('bodytype-car-display-hint').textContent = hint;
    
    // Generate brand buttons
    const brandContainer = document.getElementById('bodytype-brand-buttons');
    brandContainer.innerHTML = selectedBrandsBodyType.map(brand => `
        <button class="option-label brand-option-btn" style="cursor: pointer; transition: all 0.3s;" onclick="selectBodyTypeBrand('${brand}')">
            <span>${brand.charAt(0).toUpperCase() + brand.slice(1)}</span>
        </button>
    `).join('');
    
    // Generate body type checkboxes (updated list with all types including Compact sedan, Mini Van, Van, Pick Up, Station Wagon)
    const bodyTypes = ['Sedan', 'Compact sedan', 'Hatchback', 'SUV', 'Crossover', 'Micro Van', 'Mini Van', 'Van', 'MPV', 'Coupe', 'Convertible', 'Pick Up', 'Station Wagon'];
    const typeContainer = document.getElementById('bodytype-type-checkboxes');
    typeContainer.innerHTML = bodyTypes.map(type => `
        <label style="display: flex; align-items: center; padding: 12px; background: white; border: 2px solid #e9ecef; border-radius: 10px; cursor: pointer; transition: all 0.3s;" onmouseover="this.style.borderColor='#667eea'" onmouseout="if(!this.querySelector('input').checked) this.style.borderColor='#e9ecef'">
            <input type="checkbox" class="bodytype-checkbox" value="${type}" style="margin-right: 10px; width: 18px; height: 18px; cursor: pointer;" onchange="updateBodyTypeCheckboxStyle(this)">
            <span style="font-weight: 500;">${type}</span>
        </label>
    `).join('');
    
    // Update score display
    document.getElementById('bodytype-score-display').textContent = `Score: ${bodyTypeScore} / ${bodyTypeTotal * 2}`;
    
    // Hide next button
    document.getElementById('bodytype-next-car-btn').style.display = 'none';
}

// Select brand answer
function selectBodyTypeBrand(selectedBrand) {
    currentBodyTypeAnswers.brand = selectedBrand;
    
    // Highlight selected
    document.querySelectorAll('.brand-option-btn').forEach(btn => {
        btn.style.background = 'white';
        btn.style.borderColor = '#e9ecef';
    });
    event.target.closest('.brand-option-btn').style.background = '#e3f2fd';
    event.target.closest('.brand-option-btn').style.borderColor = '#667eea';
    
    checkBodyTypeAnswers();
}

// Update checkbox style when checked/unchecked
function updateBodyTypeCheckboxStyle(checkbox) {
    const label = checkbox.closest('label');
    if (checkbox.checked) {
        label.style.borderColor = '#667eea';
        label.style.background = '#e3f2fd';
    } else {
        label.style.borderColor = '#e9ecef';
        label.style.background = 'white';
    }
}

// Verify body type selection
function verifyBodyTypeSelection() {
    const selectedTypes = Array.from(document.querySelectorAll('.bodytype-checkbox:checked')).map(cb => cb.value);
    
    if (selectedTypes.length === 0) {
        alert('Please select at least one body type!');
        return;
    }
    
    currentBodyTypeAnswers.bodyType = selectedTypes;
    checkBodyTypeAnswers();
}

// Check both answers
async function checkBodyTypeAnswers() {
    // Wait until both are answered
    if (!currentBodyTypeAnswers.brand || !currentBodyTypeAnswers.bodyType) {
        return;
    }
    
    const car = bodyTypeQuizCars[currentBodyTypeCarIndex];
    const correctBrand = car.brand;
    
    // Fetch correct body type(s)
    let correctBodyTypes = [];
    try {
        const response = await fetch(`../cars/${car.brand}/${(car.model || car.name).toLowerCase().replace(/ /g, '_')}.json`);
        if (response.ok) {
            const carDetails = await response.json();
            if (carDetails.specifications && carDetails.specifications['Body Type']) {
                // Split by comma and trim whitespace
                correctBodyTypes = carDetails.specifications['Body Type'].split(',').map(t => t.trim());
            }
        }
    } catch (error) {
        // Skip
    }
    
    const brandCorrect = currentBodyTypeAnswers.brand === correctBrand;
    
    // Check body types - correct if user selected all correct types (no more, no less)
    const userTypes = Array.isArray(currentBodyTypeAnswers.bodyType) ? currentBodyTypeAnswers.bodyType : [currentBodyTypeAnswers.bodyType];
    const allCorrectSelected = correctBodyTypes.every(ct => userTypes.includes(ct));
    const noExtraSelected = userTypes.every(ut => correctBodyTypes.includes(ut));
    const bodyTypeCorrect = allCorrectSelected && noExtraSelected && correctBodyTypes.length > 0;
    
    bodyTypeTotal++;
    if (brandCorrect) bodyTypeScore++;
    if (bodyTypeCorrect) bodyTypeScore++;
    
    // Store result
    bodyTypeResults.push({
        car: car,
        userBrand: currentBodyTypeAnswers.brand,
        correctBrand: correctBrand,
        brandCorrect: brandCorrect,
        userBodyTypes: userTypes,
        correctBodyTypes: correctBodyTypes,
        bodyTypeCorrect: bodyTypeCorrect
    });
    
    // Highlight correct/incorrect for brands
    document.querySelectorAll('.brand-option-btn').forEach(btn => {
        const brandName = btn.textContent.trim().toLowerCase();
        btn.style.pointerEvents = 'none';
        
        if (brandName === correctBrand.toLowerCase()) {
            btn.style.borderColor = '#4caf50';
            btn.style.background = '#e8f5e9';
        } else if (brandName === currentBodyTypeAnswers.brand.toLowerCase()) {
            btn.style.borderColor = '#f44336';
            btn.style.background = '#ffebee';
        }
    });
    
    // Highlight correct/incorrect/partial for body types
    document.querySelectorAll('.bodytype-checkbox').forEach(cb => {
        const label = cb.closest('label');
        const typeName = cb.value;
        cb.disabled = true;
        label.style.cursor = 'not-allowed';
        
        const isCorrect = correctBodyTypes.includes(typeName);
        const isSelected = cb.checked;
        
        if (isCorrect && isSelected) {
            // Correct selection
            label.style.borderColor = '#4caf50';
            label.style.background = '#e8f5e9';
        } else if (isCorrect && !isSelected) {
            // Missed correct answer
            label.style.borderColor = '#ff9800';
            label.style.background = '#fff3e0';
        } else if (!isCorrect && isSelected) {
            // Wrong selection
            label.style.borderColor = '#f44336';
            label.style.background = '#ffebee';
        }
    });
    
    // Update score
    document.getElementById('bodytype-score-display').textContent = `Score: ${bodyTypeScore} / ${bodyTypeTotal * 2}`;
    
    // Update progress
    const answered = bodyTypeTotal;
    const remaining = bodyTypeQuizCars.length - currentBodyTypeCarIndex - 1;
    document.getElementById('bodytype-progress-counter').textContent = 
        `Answered: ${answered} / Remaining: ${remaining}`;
    
    // Show car image after both answers
    const imageContainer = document.getElementById('bodytype-car-image-container');
    const imageElement = document.getElementById('bodytype-car-image');
    const linkElement = document.getElementById('bodytype-car-link');
    if (car.image) {
        imageElement.src = car.image;
        imageContainer.style.display = 'block';
    }
    if (car.link) {
        linkElement.href = car.link;
    }
    
    // Show next button
    document.getElementById('bodytype-next-car-btn').style.display = 'inline-block';
}

// Move to next car
function nextCarBodyType() {
    currentBodyTypeCarIndex++;
    showBodyTypeQuizCar();
}

// Finish and show results
function finishBodyTypeQuiz() {
    const maxScore = bodyTypeTotal * 2;
    const percentage = maxScore > 0 ? Math.round((bodyTypeScore / maxScore) * 100) : 0;
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
    
    let html = `
        <div class="score-display">
            <h3>${emoji} ${bodyTypeScore} / ${maxScore}</h3>
            <p>${message} You scored ${percentage}%</p>
            <p style="margin-top: 15px; font-size: 0.9em;">Body Type Quiz Challenge</p>
        </div>
        
        <div class="result-details">
            <h3 style="margin-bottom: 20px; color: #333;">Results Breakdown:</h3>
            ${bodyTypeResults.map((result, idx) => `
                <div class="result-item ${(result.brandCorrect && result.bodyTypeCorrect) ? 'correct' : 'incorrect'}">
                    <h4>${idx + 1}. ${result.car.model || result.car.name}</h4>
                    <div style="margin-top: 10px;">
                        <p><strong>Brand ${result.brandCorrect ? '✓' : '✗'}:</strong> Your answer: ${result.userBrand.charAt(0).toUpperCase() + result.userBrand.slice(1)} | Correct: ${result.correctBrand.charAt(0).toUpperCase() + result.correctBrand.slice(1)}</p>
                        <p><strong>Body Type ${result.bodyTypeCorrect ? '✓' : '✗'}:</strong> Your answer: ${result.userBodyTypes.join(', ')} | Correct: ${result.correctBodyTypes.join(', ')}</p>
                        ${result.car.price_range ? `<p style="color: #666; font-size: 0.9em;">💰 ${result.car.price_range}</p>` : ''}
                    </div>
                </div>
            `).join('')}
        </div>
        
        <button class="retake-btn" onclick="restartBodyTypeQuiz()">Try Again 🔄</button>
    `;
    
    resultsContent.innerHTML = html;
    document.querySelector('[data-tab="results"]').click();
}

// Restart body type quiz
function restartBodyTypeQuiz() {
    document.querySelector('[data-tab="bodytype-quiz"]').click();
    document.getElementById('bodytype-filter').style.display = 'block';
    document.getElementById('bodytype-game').style.display = 'none';
}

// Initialize when DOM loads
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        if (allCars.length > 0) {
            populateBrandBodyTypeFilter();
            updateBodyTypeBrandSelection();
        }
    }, 1000);
});
