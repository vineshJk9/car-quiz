// Text Identifier Game Variables
let textIdentifierCars = [];
let selectedBrandsTextIdentifier = [];
let currentTextCarIndex = 0;
let textIdentifierScore = 0;
let textIdentifierTotal = 0;
let textIdentifierResults = [];

// Populate brand checkboxes for text identifier
function populateBrandTextIdentifierFilter() {
    const container = document.getElementById('text-id-checkboxes');
    if (!container || allCars.length === 0) return;
    
    const brands = [...new Set(allCars.map(car => car.brand))];
    brands.sort();
    
    container.innerHTML = brands.map(brand => `
        <label class="brand-checkbox-label">
            <input type="checkbox" class="text-id-filter-checkbox" value="${brand}" checked onchange="updateTextBrandSelection()">
            <span>${brand.charAt(0).toUpperCase() + brand.slice(1)}</span>
        </label>
    `).join('');
    
    selectedBrandsTextIdentifier = [...brands];
}

// Update selected brands for text identifier
function updateTextBrandSelection() {
    const checkboxes = document.querySelectorAll('.text-id-filter-checkbox');
    selectedBrandsTextIdentifier = Array.from(checkboxes)
        .filter(cb => cb.checked)
        .map(cb => cb.value);
    
    const applyBtn = document.querySelector('#text-id-filter .apply-filter-btn');
    if (applyBtn) {
        applyBtn.disabled = selectedBrandsTextIdentifier.length === 0;
        applyBtn.textContent = selectedBrandsTextIdentifier.length === 0 
            ? 'Please select at least one brand'
            : `Start with ${selectedBrandsTextIdentifier.length} Brand${selectedBrandsTextIdentifier.length > 1 ? 's' : ''} 📝`;
    }
}

// Toggle all brands in text identifier
function toggleAllBrandsTextIdentifier() {
    const checkboxes = document.querySelectorAll('.text-id-filter-checkbox');
    const allChecked = Array.from(checkboxes).every(cb => cb.checked);
    
    checkboxes.forEach(cb => {
        cb.checked = !allChecked;
    });
    
    updateTextBrandSelection();
    
    const btn = document.querySelector('#text-id-filter .select-all-btn');
    if (btn) {
        btn.textContent = allChecked ? 'Select All' : 'Deselect All';
    }
}

// Start Text Identifier game
function startTextIdentifier() {
    if (selectedBrandsTextIdentifier.length === 0) {
        alert('Please select at least one brand!');
        return;
    }
    
    const discontinuedLimitInput = document.getElementById('text-discontinued-limit').value;
    const discontinuedLimit = parseInt(discontinuedLimitInput, 10);
    
    // Validate input
    if (isNaN(discontinuedLimit) || discontinuedLimit < 0) {
        alert('Please enter a valid number for discontinued cars limit!');
        return;
    }
    
    console.log(`Starting Text Identifier with discontinued limit: ${discontinuedLimit} per brand`);
    
    // Filter cars by selected brands
    textIdentifierCars = [];
    
    selectedBrandsTextIdentifier.forEach(brand => {
        const brandCars = allCars.filter(car => car.brand === brand);
        
        // Separate by status
        const newCars = brandCars.filter(car => car.status === 'new');
        
        const upcomingCars = brandCars.filter(car => car.status === 'upcoming');
        
        // Get FIRST X discontinued cars (not random)
        const allDiscontinued = brandCars.filter(car => car.status === 'discontinued');
        const discontinuedCars = allDiscontinued.slice(0, discontinuedLimit);
        
        console.log(`${brand}: ${newCars.length} new, ${upcomingCars.length} upcoming, ${discontinuedCars.length} discontinued (limit: ${discontinuedLimit})`);
        
        textIdentifierCars.push(...newCars, ...upcomingCars, ...discontinuedCars);
    });
    
    if (textIdentifierCars.length === 0) {
        alert('No cars found for selected brands!');
        return;
    }
    
    // Shuffle cars
    textIdentifierCars = textIdentifierCars.sort(() => Math.random() - 0.5);
    
    // Reset game state
    currentTextCarIndex = 0;
    textIdentifierScore = 0;
    textIdentifierTotal = 0;
    textIdentifierResults = [];
    
    // Hide filter, show game
    document.getElementById('text-id-filter').style.display = 'none';
    document.getElementById('text-id-game').style.display = 'block';
    
    // Show first car
    showTextCarIdentifier();
}

// Show current car for identification (text only)
async function showTextCarIdentifier() {
    if (currentTextCarIndex >= textIdentifierCars.length) {
        finishTextIdentifier();
        return;
    }
    
    const car = textIdentifierCars[currentTextCarIndex];
    
    // Update progress counter
    const answered = textIdentifierTotal;
    const remaining = textIdentifierCars.length - currentTextCarIndex;
    document.getElementById('text-progress-counter').textContent = 
        `Answered: ${answered} / Remaining: ${remaining}`;
    
    // Hide image initially
    document.getElementById('text-car-image-container').style.display = 'none';
    
    // Display car info (NO IMAGE)
    document.getElementById('text-car-display-name').textContent = car.model || car.name || 'Unknown Car';
    
    // Fetch car details for additional info
    let carDetails = null;
    try {
        const response = await fetch(`../cars/${car.brand}/${(car.model || car.name).toLowerCase().replace(/ /g, '_')}.json`);
        if (response.ok) {
            carDetails = await response.json();
        }
    } catch (error) {
        // Skip if can't load
    }
    
    // Show hint (price range, status, reviews, CC, body type, mileage)
    let hint = '';
    if (car.price_range) hint += `💰 ${car.price_range}`;
    if (car.status) hint += ` • 📊 ${car.status.charAt(0).toUpperCase() + car.status.slice(1)}`;
    if (car.reviews !== undefined) hint += ` • ⭐ ${car.reviews} reviews`;
    
    // Add CC, body type, mileage from specifications
    if (carDetails && carDetails.specifications) {
        if (carDetails.specifications['Displacement']) hint += ` • 🔧 ${carDetails.specifications['Displacement']}`;
        if (carDetails.specifications['Body Type']) hint += ` • 🚗 ${carDetails.specifications['Body Type']}`;
        if (carDetails.specifications['Mileage']) hint += ` • ⛽ ${carDetails.specifications['Mileage']}`;
    }
    
    document.getElementById('text-car-display-hint').textContent = hint;
    
    // Generate brand buttons
    const optionsContainer = document.getElementById('text-brand-option-buttons');
    optionsContainer.innerHTML = selectedBrandsTextIdentifier.map(brand => `
        <button class="option-label" style="cursor: pointer; transition: all 0.3s;" onclick="checkTextBrandAnswer('${brand}')">
            <span>${brand.charAt(0).toUpperCase() + brand.slice(1)}</span>
        </button>
    `).join('');
    
    // Update score display
    document.getElementById('text-score-display').textContent = `Score: ${textIdentifierScore} / ${textIdentifierTotal}`;
    
    // Hide next button
    document.getElementById('text-next-car-btn').style.display = 'none';
}

// Check if selected brand is correct
function checkTextBrandAnswer(selectedBrand) {
    const car = textIdentifierCars[currentTextCarIndex];
    const correctBrand = car.brand;
    const isCorrect = selectedBrand === correctBrand;
    
    textIdentifierTotal++;
    if (isCorrect) {
        textIdentifierScore++;
    }
    
    // Store result
    textIdentifierResults.push({
        car: car,
        userAnswer: selectedBrand,
        correctAnswer: correctBrand,
        correct: isCorrect
    });
    
    // Highlight correct/incorrect
    const buttons = document.querySelectorAll('#text-brand-option-buttons .option-label');
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
    document.getElementById('text-score-display').textContent = `Score: ${textIdentifierScore} / ${textIdentifierTotal}`;
    
    // Update progress counter
    const answered = textIdentifierTotal;
    const remaining = textIdentifierCars.length - currentTextCarIndex - 1;
    document.getElementById('text-progress-counter').textContent = 
        `Answered: ${answered} / Remaining: ${remaining}`;
    
    // Show car image after answering
    const imageContainer = document.getElementById('text-car-image-container');
    const imageElement = document.getElementById('text-car-image');
    const linkElement = document.getElementById('text-car-link');
    if (car.image) {
        imageElement.src = car.image;
        imageContainer.style.display = 'block';
    }
    if (car.link) {
        linkElement.href = car.link;
    }
    
    // Show next button
    document.getElementById('text-next-car-btn').style.display = 'inline-block';
}

// Move to next car
function nextCarTextIdentifier() {
    currentTextCarIndex++;
    showTextCarIdentifier();
}

// Finish and show results
function finishTextIdentifier() {
    const percentage = textIdentifierTotal > 0 ? Math.round((textIdentifierScore / textIdentifierTotal) * 100) : 0;
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
            <h3>${emoji} ${textIdentifierScore} / ${textIdentifierTotal}</h3>
            <p>${message} You scored ${percentage}%</p>
            <p style="margin-top: 15px; font-size: 0.9em;">Text-Only Brand Identifier Challenge</p>
        </div>
        
        <div class="result-details">
            <h3 style="margin-bottom: 20px; color: #333;">Results Breakdown:</h3>
            ${textIdentifierResults.map((result, idx) => `
                <div class="result-item ${result.correct ? 'correct' : 'incorrect'}">
                    <h4>${idx + 1}. ${result.car.model || result.car.name} ${result.correct ? '✓' : '✗'}</h4>
                    <div style="margin-top: 10px;">
                        <p><strong>Your Answer:</strong> ${result.userAnswer.charAt(0).toUpperCase() + result.userAnswer.slice(1)}</p>
                        <p><strong>Correct Answer:</strong> ${result.correctAnswer.charAt(0).toUpperCase() + result.correctAnswer.slice(1)}</p>
                        ${result.car.price_range ? `<p style="color: #666; font-size: 0.9em;">💰 ${result.car.price_range}</p>` : ''}
                    </div>
                </div>
            `).join('')}
        </div>
        
        <button class="retake-btn" onclick="restartTextIdentifier()">Try Again 🔄</button>
    `;
    
    resultsContent.innerHTML = html;
    
    // Switch to results tab
    document.querySelector('[data-tab="results"]').click();
}

// Restart text identifier
function restartTextIdentifier() {
    document.querySelector('[data-tab="text-identifier"]').click();
    document.getElementById('text-id-filter').style.display = 'block';
    document.getElementById('text-id-game').style.display = 'none';
}

// Initialize when DOM loads
document.addEventListener('DOMContentLoaded', function() {
    // Populate text identifier filter when data is loaded
    setTimeout(() => {
        if (allCars.length > 0) {
            populateBrandTextIdentifierFilter();
            updateTextBrandSelection();
        }
    }, 1000);
});
