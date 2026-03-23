// Complete Quiz Variables (Brand + Body Type + Status)
let completeQuizCars = [];
let selectedBrandsComplete = [];
let currentCompleteCarIndex = 0;
let completeScore = 0;
let completeTotal = 0;
let completeResults = [];
let currentCompleteAnswers = { brand: null, bodyType: null, status: null };

// Populate brand checkboxes for complete quiz
function populateBrandCompleteFilter() {
    const container = document.getElementById('complete-checkboxes');
    if (!container || allCars.length === 0) return;
    
    const brands = [...new Set(allCars.map(car => car.brand))];
    brands.sort();
    
    container.innerHTML = brands.map(brand => `
        <label class="brand-checkbox-label">
            <input type="checkbox" class="complete-filter-checkbox" value="${brand}" checked onchange="updateCompleteBrandSelection()">
            <span>${brand.charAt(0).toUpperCase() + brand.slice(1)}</span>
        </label>
    `).join('');
    
    selectedBrandsComplete = [...brands];
}

// Update selected brands for complete quiz
function updateCompleteBrandSelection() {
    const checkboxes = document.querySelectorAll('.complete-filter-checkbox');
    selectedBrandsComplete = Array.from(checkboxes)
        .filter(cb => cb.checked)
        .map(cb => cb.value);
    
    const applyBtn = document.querySelector('#complete-filter .apply-filter-btn');
    if (applyBtn) {
        applyBtn.disabled = selectedBrandsComplete.length === 0;
        applyBtn.textContent = selectedBrandsComplete.length === 0 
            ? 'Please select at least one brand'
            : `Start with ${selectedBrandsComplete.length} Brand${selectedBrandsComplete.length > 1 ? 's' : ''} 🏆`;
    }
}

// Toggle all brands in complete quiz
function toggleAllBrandsComplete() {
    const checkboxes = document.querySelectorAll('.complete-filter-checkbox');
    const allChecked = Array.from(checkboxes).every(cb => cb.checked);
    
    checkboxes.forEach(cb => {
        cb.checked = !allChecked;
    });
    
    updateCompleteBrandSelection();
    
    const btn = document.querySelector('#complete-filter .select-all-btn');
    if (btn) {
        btn.textContent = allChecked ? 'Select All' : 'Deselect All';
    }
}

// Start Complete Quiz
function startCompleteQuiz() {
    if (selectedBrandsComplete.length === 0) {
        alert('Please select at least one brand!');
        return;
    }
    
    const discontinuedLimitInput = document.getElementById('complete-discontinued-limit').value;
    const discontinuedLimit = parseInt(discontinuedLimitInput, 10);
    
    if (isNaN(discontinuedLimit) || discontinuedLimit < 0) {
        alert('Please enter a valid number for discontinued cars limit!');
        return;
    }
    
    console.log(`Starting Complete Quiz with discontinued limit: ${discontinuedLimit} per brand`);
    
    // Filter cars by selected brands
    completeQuizCars = [];
    
    selectedBrandsComplete.forEach(brand => {
        const brandCars = allCars.filter(car => car.brand === brand);
        
        const newCars = brandCars.filter(car => car.status === 'new');
        const upcomingCars = brandCars.filter(car => car.status === 'upcoming');
        const allDiscontinued = brandCars.filter(car => car.status === 'discontinued');
        const discontinuedCars = allDiscontinued.slice(0, discontinuedLimit);
        
        console.log(`${brand}: ${newCars.length} new, ${upcomingCars.length} upcoming, ${discontinuedCars.length} discontinued (limit: ${discontinuedLimit})`);
        
        completeQuizCars.push(...newCars, ...upcomingCars, ...discontinuedCars);
    });
    
    if (completeQuizCars.length === 0) {
        alert('No cars found for selected brands!');
        return;
    }
    
    // Shuffle cars
    completeQuizCars = completeQuizCars.sort(() => Math.random() - 0.5);
    
    // Reset game state
    currentCompleteCarIndex = 0;
    completeScore = 0;
    completeTotal = 0;
    completeResults = [];
    
    // Hide filter, show game
    document.getElementById('complete-filter').style.display = 'none';
    document.getElementById('complete-game').style.display = 'block';
    
    // Show first car
    showCompleteQuizCar();
}

// Show current car for complete quiz
async function showCompleteQuizCar() {
    if (currentCompleteCarIndex >= completeQuizCars.length) {
        finishCompleteQuiz();
        return;
    }
    
    const car = completeQuizCars[currentCompleteCarIndex];
    currentCompleteAnswers = { brand: null, bodyType: null, status: null };
    
    // Update progress counter
    const answered = completeTotal;
    const remaining = completeQuizCars.length - currentCompleteCarIndex;
    document.getElementById('complete-progress-counter').textContent = 
        `Answered: ${answered} / Remaining: ${remaining}`;
    
    // Hide image initially
    document.getElementById('complete-car-image-container').style.display = 'none';
    
    // Display car info
    document.getElementById('complete-car-display-name').textContent = car.model || car.name || 'Unknown Car';
    
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
    
    // Show hint (without status, since that's one of the questions)
    let hint = '';
    if (car.price_range) hint += `💰 ${car.price_range}`;
    if (car.reviews !== undefined) hint += ` • ⭐ ${car.reviews} reviews`;
    if (carDetails && carDetails.specifications) {
        if (carDetails.specifications['Displacement']) hint += ` • 🔧 ${carDetails.specifications['Displacement']}`;
        if (carDetails.specifications['Mileage']) hint += ` • ⛽ ${carDetails.specifications['Mileage']}`;
    }
    document.getElementById('complete-car-display-hint').textContent = hint;
    
    // Generate brand buttons
    const brandContainer = document.getElementById('complete-brand-buttons');
    brandContainer.innerHTML = selectedBrandsComplete.map(brand => `
        <button class="option-label complete-brand-option-btn" style="cursor: pointer; transition: all 0.3s;" onclick="selectCompleteBrand('${brand}')">
            <span>${brand.charAt(0).toUpperCase() + brand.slice(1)}</span>
        </button>
    `).join('');
    
    // Generate body type checkboxes (updated list with all types)
    const bodyTypes = ['Sedan', 'Compact sedan', 'Hatchback', 'SUV', 'Crossover', 'Micro Van', 'Mini Van', 'Van', 'MPV', 'Coupe', 'Convertible', 'Pick Up', 'Station Wagon'];
    const typeContainer = document.getElementById('complete-type-checkboxes');
    typeContainer.innerHTML = bodyTypes.map(type => `
        <label style="display: flex; align-items: center; padding: 12px; background: white; border: 2px solid #e9ecef; border-radius: 10px; cursor: pointer; transition: all 0.3s;" onmouseover="this.style.borderColor='#667eea'" onmouseout="if(!this.querySelector('input').checked) this.style.borderColor='#e9ecef'">
            <input type="checkbox" class="complete-bodytype-checkbox" value="${type}" style="margin-right: 10px; width: 18px; height: 18px; cursor: pointer;" onchange="updateCompleteBodyTypeCheckboxStyle(this)">
            <span style="font-weight: 500;">${type}</span>
        </label>
    `).join('');
    
    // Generate status buttons
    const statuses = ['New', 'Upcoming', 'Discontinued'];
    const statusContainer = document.getElementById('complete-status-buttons');
    statusContainer.innerHTML = statuses.map(status => `
        <button class="option-label complete-status-option-btn" style="cursor: pointer; transition: all 0.3s;" onclick="selectCompleteStatus('${status}')">
            <span>${status}</span>
        </button>
    `).join('');
    
    // Update score display
    document.getElementById('complete-score-display').textContent = `Score: ${completeScore} / ${completeTotal * 3}`;
    
    // Hide next button
    document.getElementById('complete-next-car-btn').style.display = 'none';
}

// Select brand answer
function selectCompleteBrand(selectedBrand) {
    currentCompleteAnswers.brand = selectedBrand;
    
    // Highlight selected
    document.querySelectorAll('.complete-brand-option-btn').forEach(btn => {
        btn.style.background = 'white';
        btn.style.borderColor = '#e9ecef';
    });
    event.target.closest('.complete-brand-option-btn').style.background = '#e3f2fd';
    event.target.closest('.complete-brand-option-btn').style.borderColor = '#667eea';
    
    checkCompleteAnswers();
}

// Update checkbox style when checked/unchecked
function updateCompleteBodyTypeCheckboxStyle(checkbox) {
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
function verifyCompleteBodyTypeSelection() {
    const selectedTypes = Array.from(document.querySelectorAll('.complete-bodytype-checkbox:checked')).map(cb => cb.value);
    
    if (selectedTypes.length === 0) {
        alert('Please select at least one body type!');
        return;
    }
    
    currentCompleteAnswers.bodyType = selectedTypes;
    checkCompleteAnswers();
}

// Select status answer
function selectCompleteStatus(selectedStatus) {
    currentCompleteAnswers.status = selectedStatus.toLowerCase();
    
    // Highlight selected
    document.querySelectorAll('.complete-status-option-btn').forEach(btn => {
        btn.style.background = 'white';
        btn.style.borderColor = '#e9ecef';
    });
    event.target.closest('.complete-status-option-btn').style.background = '#e3f2fd';
    event.target.closest('.complete-status-option-btn').style.borderColor = '#667eea';
    
    checkCompleteAnswers();
}

// Check all three answers
async function checkCompleteAnswers() {
    // Wait until all three are answered
    if (!currentCompleteAnswers.brand || !currentCompleteAnswers.bodyType || !currentCompleteAnswers.status) {
        return;
    }
    
    const car = completeQuizCars[currentCompleteCarIndex];
    const correctBrand = car.brand;
    const correctStatus = car.status;
    
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
    
    const brandCorrect = currentCompleteAnswers.brand === correctBrand;
    const statusCorrect = currentCompleteAnswers.status === correctStatus;
    
    // Check body types - correct if user selected all correct types (no more, no less)
    const userTypes = Array.isArray(currentCompleteAnswers.bodyType) ? currentCompleteAnswers.bodyType : [currentCompleteAnswers.bodyType];
    const allCorrectSelected = correctBodyTypes.every(ct => userTypes.includes(ct));
    const noExtraSelected = userTypes.every(ut => correctBodyTypes.includes(ut));
    const bodyTypeCorrect = allCorrectSelected && noExtraSelected && correctBodyTypes.length > 0;
    
    completeTotal++;
    if (brandCorrect) completeScore++;
    if (bodyTypeCorrect) completeScore++;
    if (statusCorrect) completeScore++;
    
    // Store result
    completeResults.push({
        car: car,
        userBrand: currentCompleteAnswers.brand,
        correctBrand: correctBrand,
        brandCorrect: brandCorrect,
        userBodyTypes: userTypes,
        correctBodyTypes: correctBodyTypes,
        bodyTypeCorrect: bodyTypeCorrect,
        userStatus: currentCompleteAnswers.status,
        correctStatus: correctStatus,
        statusCorrect: statusCorrect
    });
    
    // Highlight correct/incorrect for brands
    document.querySelectorAll('.complete-brand-option-btn').forEach(btn => {
        const brandName = btn.textContent.trim().toLowerCase();
        btn.style.pointerEvents = 'none';
        
        if (brandName === correctBrand.toLowerCase()) {
            btn.style.borderColor = '#4caf50';
            btn.style.background = '#e8f5e9';
        } else if (brandName === currentCompleteAnswers.brand.toLowerCase()) {
            btn.style.borderColor = '#f44336';
            btn.style.background = '#ffebee';
        }
    });
    
    // Highlight correct/incorrect/partial for body types
    document.querySelectorAll('.complete-bodytype-checkbox').forEach(cb => {
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
    
    // Highlight correct/incorrect for status
    document.querySelectorAll('.complete-status-option-btn').forEach(btn => {
        const statusName = btn.textContent.trim().toLowerCase();
        btn.style.pointerEvents = 'none';
        
        if (statusName === correctStatus.toLowerCase()) {
            btn.style.borderColor = '#4caf50';
            btn.style.background = '#e8f5e9';
        } else if (statusName === currentCompleteAnswers.status.toLowerCase()) {
            btn.style.borderColor = '#f44336';
            btn.style.background = '#ffebee';
        }
    });
    
    // Update score
    document.getElementById('complete-score-display').textContent = `Score: ${completeScore} / ${completeTotal * 3}`;
    
    // Update progress
    const answered = completeTotal;
    const remaining = completeQuizCars.length - currentCompleteCarIndex - 1;
    document.getElementById('complete-progress-counter').textContent = 
        `Answered: ${answered} / Remaining: ${remaining}`;
    
    // Show car image after all three answers
    const imageContainer = document.getElementById('complete-car-image-container');
    const imageElement = document.getElementById('complete-car-image');
    const linkElement = document.getElementById('complete-car-link');
    if (car.image) {
        imageElement.src = car.image;
        imageContainer.style.display = 'block';
    }
    if (car.link) {
        linkElement.href = car.link;
    }
    
    // Show next button
    document.getElementById('complete-next-car-btn').style.display = 'inline-block';
}

// Move to next car
function nextCarComplete() {
    currentCompleteCarIndex++;
    showCompleteQuizCar();
}

// Finish and show results
function finishCompleteQuiz() {
    const maxScore = completeTotal * 3;
    const percentage = maxScore > 0 ? Math.round((completeScore / maxScore) * 100) : 0;
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
            <h3>${emoji} ${completeScore} / ${maxScore}</h3>
            <p>${message} You scored ${percentage}%</p>
            <p style="margin-top: 15px; font-size: 0.9em;">Complete Quiz Challenge (Brand + Body Type + Status)</p>
        </div>
        
        <div class="result-details">
            <h3 style="margin-bottom: 20px; color: #333;">Results Breakdown:</h3>
            ${completeResults.map((result, idx) => `
                <div class="result-item ${(result.brandCorrect && result.bodyTypeCorrect && result.statusCorrect) ? 'correct' : 'incorrect'}">
                    <h4>${idx + 1}. ${result.car.model || result.car.name}</h4>
                    <div style="margin-top: 10px;">
                        <p><strong>Brand ${result.brandCorrect ? '✓' : '✗'}:</strong> Your answer: ${result.userBrand.charAt(0).toUpperCase() + result.userBrand.slice(1)} | Correct: ${result.correctBrand.charAt(0).toUpperCase() + result.correctBrand.slice(1)}</p>
                        <p><strong>Body Type ${result.bodyTypeCorrect ? '✓' : '✗'}:</strong> Your answer: ${result.userBodyTypes.join(', ')} | Correct: ${result.correctBodyTypes.join(', ')}</p>
                        <p><strong>Status ${result.statusCorrect ? '✓' : '✗'}:</strong> Your answer: ${result.userStatus.charAt(0).toUpperCase() + result.userStatus.slice(1)} | Correct: ${result.correctStatus.charAt(0).toUpperCase() + result.correctStatus.slice(1)}</p>
                        ${result.car.price_range ? `<p style="color: #666; font-size: 0.9em;">💰 ${result.car.price_range}</p>` : ''}
                    </div>
                </div>
            `).join('')}
        </div>
        
        <button class="retake-btn" onclick="restartCompleteQuiz()">Try Again 🔄</button>
    `;
    
    resultsContent.innerHTML = html;
    document.querySelector('[data-tab="results"]').click();
}

// Restart complete quiz
function restartCompleteQuiz() {
    document.querySelector('[data-tab="complete-quiz"]').click();
    document.getElementById('complete-filter').style.display = 'block';
    document.getElementById('complete-game').style.display = 'none';
}

// Initialize when DOM loads
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        if (allCars.length > 0) {
            populateBrandCompleteFilter();
            updateCompleteBrandSelection();
        }
    }, 1000);
});
