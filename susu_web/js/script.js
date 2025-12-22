document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const savedAmountInput = document.getElementById('saved-amount');
    const calculateBtn = document.getElementById('calculate-btn');
    const resultDiv = document.getElementById('result');
    const resultContent = document.getElementById('result-content');
    const loadingDiv = document.getElementById('loading');
    const resultTitle = document.getElementById('result-title');
    const resultStats = document.getElementById('result-stats');
    const btnText = document.getElementById('btn-text');
    const btnSpinner = document.getElementById('btn-spinner');

    // Event Listeners
    calculateBtn.addEventListener('click', calculateSavings);
    savedAmountInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') calculateSavings();
    });

    // Main Calculation Function
    function calculateSavings() {
        const savedAmount = parseInt(savedAmountInput.value) || 0;
        
        // Validate input
        if (savedAmount < 0) {
            showError('Please enter a non-negative number');
            return;
        }

        // UI Loading State
        setLoading(true);
        
        // Simulate API call
        setTimeout(() => {
            try {
                const result = calculateSavingsData(savedAmount);
                displayResults(result);
            } catch (error) {
                console.error('Error:', error);
                showError('An error occurred. Please try again.');
            } finally {
                setLoading(false);
            }
        }, 800);
    }

    // Business Logic
    function calculateSavingsData(totalSaved) {
        if (totalSaved < 0) {
            throw new Error('Total saved cannot be negative');
        }

        // Using quadratic formula to solve n^2 + n - 2*totalSaved = 0
        const currentDay = Math.floor((-1 + Math.sqrt(1 + 8 * totalSaved)) / 2);
        const todayAmount = currentDay + 1;
        const newTotal = totalSaved + todayAmount;
        const progress = Math.min(currentDay / 365, 1);
        const isComplete = currentDay >= 365;

        return {
            currentDay,
            todayAmount,
            newTotal,
            progress,
            isComplete
        };
    }

    // UI Helpers
    function setLoading(isLoading) {
        if (isLoading) {
            btnText.style.visibility = 'hidden';
            btnSpinner.style.display = 'block';
            loadingDiv.style.display = 'flex';
            resultContent.style.display = 'none';
            resultDiv.style.display = 'block';
        } else {
            btnText.style.visibility = 'visible';
            btnSpinner.style.display = 'none';
            loadingDiv.style.display = 'none';
            resultContent.style.display = 'block';
        }
        calculateBtn.disabled = isLoading;
    }

    function showError(message) {
        alert(message);
    }

    function displayResults(result) {
        const { currentDay, todayAmount, newTotal, progress, isComplete } = result;

        if (isComplete) {
            showCompletedChallenge(newTotal);
        } else {
            showActiveChallenge(currentDay, todayAmount, newTotal, progress);
        }

        // Animate result display
        resultDiv.style.display = 'block';
        resultContent.classList.add('fade-in');
    }

    function showActiveChallenge(currentDay, todayAmount, newTotal, progress) {
        resultTitle.innerHTML = '<i class="fas fa-chart-line"></i> Your Savings Plan';
        
        resultStats.innerHTML = `
            <div class="stat-item">
                <span class="stat-label"><i class="fas fa-calendar-day"></i> Current Day</span>
                <span class="stat-value">${currentDay} of 365</span>
            </div>
            <div class="stat-item">
                <span class="stat-label"><i class="fas fa-piggy-bank"></i> Save Today</span>
                <span class="stat-value">GHS ${todayAmount}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label"><i class="fas fa-coins"></i> New Total</span>
                <span class="stat-value">GHS ${newTotal}</span>
            </div>
            <div class="progress-container">
                <div class="progress-bar" style="width: ${progress * 100}%"></div>
            </div>
            <div class="progress-text">${(progress * 100).toFixed(1)}% complete</div>
            
            <div class="motivational-quote">
                <i class="fas fa-quote-left"></i>
                <p>${getMotivationalQuote(progress)}</p>
            </div>
        `;
    }

    function showCompletedChallenge(totalSaved) {
        resultTitle.innerHTML = '<i class="fas fa-trophy"></i> Challenge Complete!';
        
        resultStats.innerHTML = `
            <div class="completed">
                <i class="fas fa-award"></i>
                <h3>Congratulations! 🎉</h3>
                <p>You've successfully completed the 365-day SuSu challenge!</p>
                
                <div class="total-saved">
                    <div class="amount">GHS ${totalSaved}</div>
                    <div class="label">Total Saved</div>
                </div>
                
                <p class="celebration-message">
                    You're a savings superstar! Consider starting a new challenge or investing your savings.
                </p>
                
                <button class="primary-btn" onclick="shareAchievement(${totalSaved})">
                    <i class="fas fa-share"></i> Share Achievement
                </button>
            </div>
        `;
    }

    function getMotivationalQuote(progress) {
        const quotes = [
            "Small amounts add up to big savings over time!",
            "Every cedi counts! Keep up the great work!",
            "Consistency is the key to financial success!",
            "You're building a better future, one day at a time!",
            "Your future self will thank you for this!",
            "Financial freedom starts with small, consistent steps!"
        ];
        
        // Select quote based on progress
        let index;
        if (progress < 0.25) {
            index = 0;
        } else if (progress < 0.5) {
            index = 1;
        } else if (progress < 0.75) {
            index = 2;
        } else {
            index = 3 + Math.floor(Math.random() * 3); // Random from last 3 quotes
        }
        
        return quotes[Math.min(index, quotes.length - 1)];
    }

    // Make share function available globally
    window.shareAchievement = function(totalSaved) {
        const shareText = `I've saved GHS ${totalSaved} with the SuSu 365-day challenge! 🎉 Start your savings journey today! #SuSuSavings`;
        
        if (navigator.share) {
            navigator.share({
                title: 'My SuSu Savings Achievement',
                text: shareText,
                url: window.location.href
            }).catch(console.error);
        } else {
            // Fallback for browsers that don't support Web Share API
            const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
            window.open(shareUrl, '_blank');
        }
    };
});
