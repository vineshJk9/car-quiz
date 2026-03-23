// Brand Identifier Game Variables
let brandIdentifierCars = [];
let selectedBrandsIdentifier = [];
let currentCarIndex = 0;
let identifierScore = 0;
let identifierTotal = 0;
let identifierResults = [];

// Populate brand checkboxes for identifier
function populateBrandIdentifierFilter() {
    const container = document.getElementById('brand-id-checkboxes');
    if (!container || allCars.length === 0) return;
    
    const brands = [...new Set(allCars.map(car => car.brand))];
    brands.sort();
    
    container.innerHTML = brands.map(brand => `
        <label class="brand-checkbox-label">
            <input type="checkbox" class="brand-id-filter-checkbox" value="${brand}" checked onchange="updateBrandIdentifierSelection()">
            <span>${brand.charAt(0).toUpperCase() + brand.slice(1)}</span>
        </label>
    `).join('');
    
    selectedBrandsIdentifier = [...brands];
}

// Update selected brands for identifier
function updateBrandIdentifierSelection() {
    const checkboxes = document.querySelectorAll('.brand-id-filter-checkbox');
    selectedBrandsIdentifier = Array.from(checkboxes)
        .filter(cb => cb.checked)
        .map(cb => cb.value);
    
    const applyBtn = document.querySelector('#brand-id-filter .apply-filter-btn');
    if (applyBtn) {
        applyBtn.disabled = selectedBrandsIdentifier.length === 0;
        applyBtn.textContent = selectedBrandsIdentifier.length === 0 
            ? 'Please select at least one brand'
            : `Start with ${selectedBrandsIdentifier.length} Brand${selectedBrandsIdentifier.length > 1 ? 's' : ''} 🎯`;
    }
}

// Toggle all brands in identifier
function toggleAllBrandsIdentifier() {
    const checkboxes = document.querySelectorAll('.brand-id-filter-checkbox');
    const allChecked = Array.from(checkboxes).every(cb => cb.checked);
    
    checkboxes.forEach(cb => {
        cb.checked = !allChecked;
    });
    
    updateBrandIdentifierSelection();
    
    const btn = document.querySelector('#brand-id-filter .select-all-btn');
    if (btn) {
        btn.textContent = allChecked ? 'Select All' : 'Deselect All';
    }
}

// Start Brand Identifier game
function startBrandIdentifier() {
    if (selectedBrandsIdentifier.length === 0) {
        alert('Please select at least one brand!');
        return;
    }
    
    const discontinuedLimitInput = document.getElementById('discontinued-limit').value;
    const discontinuedLimit = parseInt(discontinuedLimitInput, 10);
    
    // Validate input
    if (isNaN(discontinuedLimit) || discontinuedLimit < 0) {
        alert('Please enter a valid number for discontinued cars limit!');
        return;
    }
    
    console.log(`Starting Brand Identifier with discontinued limit: ${discontinuedLimit} per brand`);
    
    // Filter cars by selected brands
    brandIdentifierCars = [];
    
    selectedBrandsIdentifier.forEach(brand => {
        const brandCars = allCars.filter(car => car.brand === brand);
        
        // Separate by status
        const newCars = brandCars.filter(car => car.status === 'new');
        
        const upcomingCars = brandCars.filter(car => car.status === 'upcoming');
        
        // Get FIRST X discontinued cars (not random)
        const allDiscontinued = brandCars.filter(car => car.status === 'discontinued');
        const discontinuedCars = allDiscontinued.slice(0, discontinuedLimit);
        
        console.log(`${brand}: ${newCars.length} new, ${upcomingCars.length} upcoming, ${discontinuedCars.length} discontinued (limit: ${discontinuedLimit})`);
        
        brandIdentifierCars.push(...newCars, ...upcomingCars, ...discontinuedCars);
    });
    
    if (brandIdentifierCars.length === 0) {
        alert('No cars found for selected brands!');
        return;
    }
    
    // Shuffle cars
    brandIdentifierCars = brandIdentifierCars.sort(() => Math.random() - 0.5);
    
    // Reset game state
    currentCarIndex = 0;
    identifierScore = 0;
    identifierTotal = 0;
    identifierResults = [];
    
    // Hide filter, show game
    document.getElementById('brand-id-filter').style.display = 'none';
    document.getElementById('brand-id-game').style.display = 'block';
    
    // Show first car
    showCarIdentifier();
}

// Show current car for identification
function showCarIdentifier() {
    if (currentCarIndex >= brandIdentifierCars.length) {
        finishBrandIdentifier();
        return;
    }
    
    const car = brandIdentifierCars[currentCarIndex];
    
    // Display car info
    document.getElementById('car-display-name').textContent = car.model || car.name || 'Unknown Car';
    
    const carImage = document.getElementById('car-display-image');
    carImage.src = car.image || '';
    carImage.onerror = function() {
        this.src = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22250%22%3E%3Crect fill=%22%23ddd%22 width=%22400%22 height=%22250%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22%23666%22 font-size=%2224%22%3ECar Image%3C/text%3E%3C/svg%3E';
    };
    
    // Show hint (price range, status)
    let hint = '';
    if (car.price_range) hint += `💰 ${car.price_range}`;
    if (car.status) hint += ` • 📊 ${car.status.charAt(0).toUpperCase() + car.status.slice(1)}`;
    document.getElementById('car-display-hint').textContent = hint;
    
    // Generate brand buttons
    const optionsContainer = document.getElementById('brand-option-buttons');
    optionsContainer.innerHTML = selectedBrandsIdentifier.map(brand => `
        <button class="option-label" style="cursor: pointer; transition: all 0.3s;" onclick="checkBrandAnswer('${brand}')">
            <span>${brand.charAt(0).toUpperCase() + brand.slice(1)}</span>
        </button>
    `).join('');
    
    // Update score display
    document.getElementById('score-display').textContent = `Score: ${identifierScore} / ${identifierTotal}`;
    
    // Hide next button
    document.getElementById('next-car-btn').style.display = 'none';
}

// Check if selected brand is correct
function checkBrandAnswer(selectedBrand) {
    const car = brandIdentifierCars[currentCarIndex];
    const correctBrand = car.brand;
    const isCorrect = selectedBrand === correctBrand;
    
    identifierTotal++;
    if (isCorrect) {
        identifierScore++;
    }
    
    // Store result
    identifierResults.push({
        car: car,
        userAnswer: selectedBrand,
        correctAnswer: correctBrand,
        correct: isCorrect
    });
    
    // Highlight correct/incorrect
    const buttons = document.querySelectorAll('#brand-option-buttons .option-label');
    buttons.forEach(btn => {
        const brandName = btn.textContent.trim().toLowerCase();
        btn.style.pointerEvents = 'none';
        
        if (brandName === correctBrand.toLowerCase()) {
            btn.classList.add('correct');
            btn.style.borderColor = '#4caf50';
            btn.style.background = '#e8f5e9';
        } else if (brandName === selectedBrand.toLowerCase()) {
            btn.classList.add('incorrect');
            btn.style.borderColor = '#f44336';
            btn.style.background = '#ffebee';
        }
    });
    
    // Update score
    document.getElementById('score-display').textContent = `Score: ${identifierScore} / ${identifierTotal}`;
    
    // Show next button
    document.getElementById('next-car-btn').style.display = 'inline-block';
}

// Move to next car
function nextCarIdentifier() {
    currentCarIndex++;
    showCarIdentifier();
}

// Finish and show results
function finishBrandIdentifier() {
    const percentage = identifierTotal > 0 ? Math.round((identifierScore / identifierTotal) * 100) : 0;
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
            <h3>${emoji} ${identifierScore} / ${identifierTotal}</h3>
            <p>${message} You scored ${percentage}%</p>
            <p style="margin-top: 15px; font-size: 0.9em;">Brand Identifier Challenge</p>
        </div>
        
        <div class="result-details">
            <h3 style="margin-bottom: 20px; color: #333;">Results Breakdown:</h3>
            ${identifierResults.map((result, idx) => `
                <div class="result-item ${result.correct ? 'correct' : 'incorrect'}">
                    <h4>${idx + 1}. ${result.car.model || result.car.name} ${result.correct ? '✓' : '✗'}</h4>
                    <div style="display: flex; align-items: center; gap: 20px; margin-top: 10px;">
                        <img src="${result.car.image}" alt="${result.car.model}" style="width: 150px; height: 90px; object-fit: cover; border-radius: 8px;" onerror="this.style.display='none'">
                        <div>
                            <p><strong>Your Answer:</strong> ${result.userAnswer.charAt(0).toUpperCase() + result.userAnswer.slice(1)}</p>
                            <p><strong>Correct Answer:</strong> ${result.correctAnswer.charAt(0).toUpperCase() + result.correctAnswer.slice(1)}</p>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
        
        <button class="retake-btn" onclick="restartBrandIdentifier()">Try Again 🔄</button>
    `;
    
    resultsContent.innerHTML = html;
    
    // Switch to results tab
    document.querySelector('[data-tab="results"]').click();
}

// Restart brand identifier
function restartBrandIdentifier() {
    document.querySelector('[data-tab="brand-identifier"]').click();
    document.getElementById('brand-id-filter').style.display = 'block';
    document.getElementById('brand-id-game').style.display = 'none';
}

// Initialize when DOM loads
document.addEventListener('DOMContentLoaded', function() {
    // Populate brand identifier filter when data is loaded
    setTimeout(() => {
        if (allCars.length > 0) {
            populateBrandIdentifierFilter();
            updateBrandIdentifierSelection();
        }
    }, 1000);
});
