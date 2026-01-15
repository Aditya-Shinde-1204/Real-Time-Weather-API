// API Key and initial setup
const API_KEY = "cf2503c5d9fc53732f88bdf3075f65b3";
let currentCity = "Pune";
let searchHistory = JSON.parse(localStorage.getItem("weatherSearchHistory")) || [];
let carouselPosition = 0;
let carouselItemsPerView = 3;

// Default cities to display initially
const defaultCities = [
    "London", "New York", "Tokyo", "Paris", "Sydney",
    "Dubai", "Moscow", "Berlin", "Rome", "Toronto"
];

// DOM Elements
const cityInput = document.getElementById("city-input");
const searchBtn = document.getElementById("search-btn");
const clearHistoryBtn = document.getElementById("clear-history");
const themeToggle = document.getElementById("themeToggle");
const loadingDiv = document.getElementById("loading");
const recentSearchesDiv = document.getElementById("recent-searches");
const historyCarousel = document.getElementById("history-carousel");
const carouselPrevBtn = document.querySelector(".carousel-btn.prev");
const carouselNextBtn = document.querySelector(".carousel-btn.next");
const carouselIndicators = document.getElementById("carousel-indicators");
const emptyHistoryDiv = document.getElementById("empty-history");

// Weather display elements
const cityNameEl = document.getElementById("city-name");
const weatherConditionEl = document.getElementById("weather-condition");
const temperatureEl = document.getElementById("temperature");
const tempRangeEl = document.getElementById("temp-range");
const weatherIconEl = document.getElementById("weather-icon");
const windSpeedEl = document.getElementById("wind-speed");
const humidityEl = document.getElementById("humidity");
const feelsLikeEl = document.getElementById("feels-like");
const visibilityEl = document.getElementById("visibility");
const currentDateEl = document.getElementById("current-date");
const currentTimeEl = document.getElementById("current-time");
const totalSearchesEl = document.getElementById("total-searches");
const uniqueCitiesEl = document.getElementById("unique-cities");

// New element for default cities section
let defaultCitiesContainer = null;

// Initialize the app
document.addEventListener("DOMContentLoaded", function () {
    updateDateTime();
    fetchWeatherData(currentCity);
    updateSearchHistory();
    updateRecentSearches();
    updateCarouselItemsPerView();
    
    // Create and display default cities section
    createDefaultCitiesSection();
    fetchDefaultCitiesWeather();
    
    // Update time every minute
    setInterval(updateDateTime, 60000);
    
    // Setup event listeners
    searchBtn.addEventListener("click", handleSearch);
    clearHistoryBtn.addEventListener("click", clearSearchHistory);
    themeToggle.addEventListener("click", toggleTheme);
    cityInput.addEventListener("keypress", function (e) {
        if (e.key === "Enter") handleSearch();
    });
    
    // Carousel controls
    carouselPrevBtn.addEventListener("click", () => moveCarousel(-1));
    carouselNextBtn.addEventListener("click", () => moveCarousel(1));
    
    // Update carousel on window resize
    window.addEventListener("resize", updateCarouselItemsPerView);
    
    // Create 3D scene
    create3DScene();
});

// Theme Toggle
function toggleTheme() {
    const body = document.body;
    const themeIcon = themeToggle.querySelector("i");
    
    if (body.classList.contains("dark-mode")) {
        body.classList.remove("dark-mode");
        body.classList.add("light-mode");
        themeIcon.className = "fas fa-sun";
    } else {
        body.classList.remove("light-mode");
        body.classList.add("dark-mode");
        themeIcon.className = "fas fa-moon";
    }
    
    // Update weather icon color based on theme
    updateWeatherIconColor();
    
    // Save theme preference
    localStorage.setItem("theme", body.classList.contains("dark-mode") ? "dark" : "light");
    
    // Recreate 3D scene with new theme
    create3DScene();
}

// Handle search functionality
function handleSearch() {
    const city = cityInput.value.trim();
    if (city) {
        addToSearchHistory(city);
        currentCity = city;
        fetchWeatherData(city);
    }
}

// Add to search history
function addToSearchHistory(city) {
    // Check if city already exists
    const existingIndex = searchHistory.findIndex(
        item => item.city.toLowerCase() === city.toLowerCase()
    );
    
    if (existingIndex !== -1) {
        // Remove existing entry to re-add at the beginning
        searchHistory.splice(existingIndex, 1);
    }
    
    // Add new entry with timestamp
    searchHistory.unshift({
        city: city,
        timestamp: new Date().toISOString(),
        date: new Date().toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric"
        }),
        time: new Date().toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit"
        })
    });
    
    // Keep only last 10 searches
    if (searchHistory.length > 10) {
        searchHistory = searchHistory.slice(0, 10);
    }
    
    // Save to localStorage
    localStorage.setItem("weatherSearchHistory", JSON.stringify(searchHistory));
    
    // Update UI
    updateSearchHistory();
    updateRecentSearches();
}

// Update search history carousel
function updateSearchHistory() {
    historyCarousel.innerHTML = "";
    
    if (searchHistory.length === 0) {
        emptyHistoryDiv.classList.remove("hidden");
        historyCarousel.appendChild(emptyHistoryDiv);
        carouselIndicators.innerHTML = "";
        updateHistoryStats();
        return;
    }
    
    emptyHistoryDiv.classList.add("hidden");
    
    // Add history cards
    searchHistory.forEach((item, index) => {
        const historyCard = document.createElement("div");
        historyCard.className = "history-card flex-shrink-0";
        historyCard.style.minWidth = `${getCarouselItemWidth()}px`;
        
        historyCard.innerHTML = `
            <div class="flex justify-between items-start mb-3">
                <div>
                    <h3 class="font-bold text-lg">${item.city}</h3>
                    <p class="text-sm opacity-70">${item.date} • ${item.time}</p>
                </div>
                <i class="fas fa-cloud text-xl opacity-70"></i>
            </div>
            <button class="w-full py-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transition-all duration-300 text-white font-medium mt-2" onclick="searchCity('${item.city}')">
                View Weather
            </button>
        `;
        
        historyCarousel.appendChild(historyCard);
    });
    
    // Update carousel indicators
    updateCarouselIndicators();
    
    // Reset carousel position
    carouselPosition = 0;
    updateCarouselTransform();
    
    // Update stats
    updateHistoryStats();
}

// Update recent searches chips
function updateRecentSearches() {
    recentSearchesDiv.innerHTML = "";
    
    if (searchHistory.length === 0) {
        recentSearchesDiv.innerHTML = '<span class="opacity-70">No recent searches</span>';
        return;
    }
    
    // Show only the first 5 recent searches
    const recentToShow = searchHistory.slice(0, 5);
    
    recentToShow.forEach(item => {
        const chip = document.createElement("div");
        chip.className = "recent-chip";
        chip.textContent = item.city;
        chip.onclick = () => searchCity(item.city);
        recentSearchesDiv.appendChild(chip);
    });
}

// Update history statistics
function updateHistoryStats() {
    totalSearchesEl.textContent = searchHistory.length;
    
    // Count unique cities
    const uniqueCities = [...new Set(searchHistory.map(item => item.city.toLowerCase()))];
    uniqueCitiesEl.textContent = uniqueCities.length;
}

// Clear search history
function clearSearchHistory() {
    if (searchHistory.length === 0) return;
    
    if (confirm("Are you sure you want to clear your search history?")) {
        searchHistory = [];
        localStorage.removeItem("weatherSearchHistory");
        updateSearchHistory();
        updateRecentSearches();
    }
}

// Search for a city from history
function searchCity(city) {
    cityInput.value = city;
    handleSearch();
}

// Carousel functions
function getCarouselItemWidth() {
    if (window.innerWidth < 640) return 180;
    if (window.innerWidth < 1024) return 200;
    return 220;
}

function updateCarouselItemsPerView() {
    if (window.innerWidth < 640) carouselItemsPerView = 1;
    else if (window.innerWidth < 1024) carouselItemsPerView = 2;
    else carouselItemsPerView = 3;
    
    updateCarouselIndicators();
    updateCarouselTransform();
}

function moveCarousel(direction) {
    if (searchHistory.length <= carouselItemsPerView) {
        carouselPosition = 0;
        updateCarouselTransform();
        return;
    }
    
    carouselPosition += direction;
    
    // Clamp position
    const maxPosition = Math.max(0, searchHistory.length - carouselItemsPerView);
    carouselPosition = Math.max(0, Math.min(carouselPosition, maxPosition));
    
    updateCarouselTransform();
    updateCarouselIndicators();
}

function updateCarouselTransform() {
    const itemWidth = getCarouselItemWidth() + 20;
    const translateX = -carouselPosition * itemWidth;
    historyCarousel.style.transform = `translateX(${translateX}px)`;
}

function updateCarouselIndicators() {
    if (searchHistory.length <= carouselItemsPerView) {
        carouselIndicators.innerHTML = "";
        return;
    }
    
    const indicatorCount = Math.ceil(searchHistory.length / carouselItemsPerView);
    carouselIndicators.innerHTML = "";
    
    for (let i = 0; i < indicatorCount; i++) {
        const indicator = document.createElement("button");
        indicator.className = `w-2 h-2 rounded-full ${i === Math.floor(carouselPosition / carouselItemsPerView) ? 'bg-blue-500' : 'bg-gray-400'}`;
        indicator.onclick = () => {
            carouselPosition = i * carouselItemsPerView;
            updateCarouselTransform();
            updateCarouselIndicators();
        };
        carouselIndicators.appendChild(indicator);
    }
}

// Fetch weather data from API
async function fetchWeatherData(city) {
    showLoading(true);
    
    try {
        const response = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`
        );
        
        if (!response.ok) {
            throw new Error("City not found");
        }
        
        const data = await response.json();
        console.log(data);
        displayWeatherData(data);
        update3DScene(data.weather[0].main);
    } catch (error) {
        alert(`Error: ${error.message}. Please try another city.`);
        cityInput.value = currentCity;
    } finally {
        showLoading(false);
    }
}

// Display weather data in the UI
function displayWeatherData(data) {
    // City and country
    cityNameEl.textContent = `${data.name}, ${data.sys.country}`;
    
    // Temperature
    const tempCelsius = Math.round(data.main.temp);
    const tempMin = Math.round(data.main.temp_min);
    const tempMax = Math.round(data.main.temp_max);
    const feelsLike = Math.round(data.main.feels_like);
    
    temperatureEl.textContent = tempCelsius;
    tempRangeEl.textContent = `${tempMin}°C / ${tempMax}°C`;
    feelsLikeEl.textContent = feelsLike;
    
    // Weather condition
    const condition = data.weather[0].description;
    weatherConditionEl.textContent = condition;
    
    // Weather icon
    const iconCode = data.weather[0].icon;
    const iconClass = getWeatherIcon(iconCode);
    weatherIconEl.className = `fas fa-${iconClass} text-8xl`;
    
    // Update icon color based on theme
    updateWeatherIconColor();
    
    // Other details
    windSpeedEl.textContent = data.wind.speed;
    humidityEl.textContent = data.main.humidity;
    visibilityEl.textContent = (data.visibility / 1000).toFixed(1);
    
    // Update 3D scene based on weather
    update3DScene(data.weather[0].main);
}

// Map OpenWeatherMap icon codes to FontAwesome icons
function getWeatherIcon(iconCode) {
    const iconMap = {
        "01d": "sun",
        "01n": "moon",
        "02d": "cloud-sun",
        "02n": "cloud-moon",
        "03d": "cloud",
        "03n": "cloud",
        "04d": "cloud",
        "04n": "cloud",
        "09d": "cloud-rain",
        "09n": "cloud-rain",
        "10d": "cloud-sun-rain",
        "10n": "cloud-moon-rain",
        "11d": "bolt",
        "11n": "bolt",
        "13d": "snowflake",
        "13n": "snowflake",
        "50d": "smog",
        "50n": "smog"
    };
    
    return iconMap[iconCode] || "cloud";
}

// Update weather icon color based on theme
function updateWeatherIconColor() {
    const body = document.body;
    const isDarkMode = body.classList.contains("dark-mode");
    
    if (isDarkMode) {
        weatherIconEl.style.color = "#f6e05e"; // Yellow for dark mode
    } else {
        weatherIconEl.style.color = "#f6ad55"; // Orange for light mode
    }
}

// Update date and time display
function updateDateTime() {
    const now = new Date();
    
    // Format date
    const options = {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric"
    };
    currentDateEl.textContent = now.toLocaleDateString("en-US", options);
    
    // Format time
    const timeOptions = { hour: "2-digit", minute: "2-digit", hour12: true };
    currentTimeEl.textContent = now.toLocaleTimeString("en-US", timeOptions);
}

// Show/hide loading spinner
function showLoading(isLoading) {
    if (isLoading) {
        loadingDiv.classList.remove("hidden");
    } else {
        loadingDiv.classList.add("hidden");
    }
}

// Create 3D scene with CSS animations
function create3DScene() {
    const sceneContainer = document.getElementById("scene-container");
    
    // Clear any existing elements
    sceneContainer.innerHTML = "";
    
    // Create sun/moon
    const sun = document.createElement("div");
    sun.className = "sun absolute top-10 right-10 w-24 h-24 rounded-full";
    sun.style.background = "radial-gradient(circle, #ffde00, #ff8c00)";
    sun.style.boxShadow = "0 0 60px 20px rgba(255, 200, 0, 0.5)";
    sceneContainer.appendChild(sun);
    
    // Create clouds
    for (let i = 0; i < 5; i++) {
        const cloud = document.createElement("div");
        cloud.className = "cloud absolute rounded-full";
        cloud.style.width = `${Math.random() * 120 + 60}px`;
        cloud.style.height = `${Math.random() * 40 + 20}px`;
        cloud.style.top = `${Math.random() * 50 + 10}%`;
        cloud.style.left = `${Math.random() * 100}%`;
        cloud.style.animationDelay = `${Math.random() * 30}s`;
        cloud.style.filter = "blur(10px)";
        
        if (document.body.classList.contains("dark-mode")) {
            cloud.style.background = "rgba(255, 255, 255, 0.1)";
        } else {
            cloud.style.background = "rgba(255, 255, 255, 0.3)";
        }
        
        sceneContainer.appendChild(cloud);
    }
    
    // Create stars (for dark mode)
    if (document.body.classList.contains("dark-mode")) {
        for (let i = 0; i < 50; i++) {
            const star = document.createElement("div");
            star.className = "absolute bg-white rounded-full";
            star.style.width = `${Math.random() * 3 + 1}px`;
            star.style.height = star.style.width;
            star.style.top = `${Math.random() * 100}%`;
            star.style.left = `${Math.random() * 100}%`;
            star.style.opacity = `${Math.random() * 0.7 + 0.3}`;
            star.style.boxShadow = "0 0 5px 1px white";
            sceneContainer.appendChild(star);
        }
    }
}

// Update 3D scene based on weather conditions
function update3DScene(weatherCondition) {
    const sceneContainer = document.getElementById("scene-container");
    const body = document.body;
    const isDarkMode = body.classList.contains("dark-mode");
    
    // Clear existing weather effects
    document.querySelectorAll(".rain-drop, .snowflake").forEach(el => el.remove());
    
    // Add effects based on weather
    switch (weatherCondition.toLowerCase()) {
        case "rain":
        case "drizzle":
            createRainEffect(isDarkMode);
            break;
        case "snow":
            createSnowEffect(isDarkMode);
            break;
        case "thunderstorm":
            createRainEffect(isDarkMode);
            // Add occasional lightning flashes
            setInterval(() => {
                sceneContainer.style.backgroundColor = isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(255, 255, 255, 0.3)";
                setTimeout(() => {
                    sceneContainer.style.backgroundColor = "";
                }, 100);
            }, 3000);
            break;
        case "clear":
            // Make sun brighter
            document.querySelector(".sun").style.boxShadow = "0 0 80px 30px rgba(255, 220, 0, 0.7)";
            break;
        case "clouds":
            // Add more clouds
            for (let i = 0; i < 3; i++) {
                const cloud = document.createElement("div");
                cloud.className = "cloud absolute rounded-full";
                cloud.style.width = `${Math.random() * 150 + 80}px`;
                cloud.style.height = `${Math.random() * 50 + 30}px`;
                cloud.style.top = `${Math.random() * 50 + 10}%`;
                cloud.style.left = `${Math.random() * 100}%`;
                cloud.style.animationDelay = `${Math.random() * 30}s`;
                cloud.style.filter = "blur(15px)";
                
                if (isDarkMode) {
                    cloud.style.background = "rgba(255, 255, 255, 0.15)";
                } else {
                    cloud.style.background = "rgba(255, 255, 255, 0.4)";
                }
                
                sceneContainer.appendChild(cloud);
            }
            break;
    }
}

// Create rain effect
function createRainEffect(isDarkMode) {
    const sceneContainer = document.getElementById("scene-container");
    
    for (let i = 0; i < 60; i++) {
        const rainDrop = document.createElement("div");
        rainDrop.className = "rain-drop absolute rounded-full";
        rainDrop.style.width = "2px";
        rainDrop.style.height = "20px";
        rainDrop.style.left = `${Math.random() * 100}%`;
        rainDrop.style.top = `${Math.random() * 100}%`;
        rainDrop.style.animationDelay = `${Math.random() * 2}s`;
        rainDrop.style.opacity = `${Math.random() * 0.5 + 0.3}`;
        rainDrop.style.background = isDarkMode
            ? "linear-gradient(to bottom, transparent, #60a5fa)"
            : "linear-gradient(to bottom, transparent, #3b82f6)";
        sceneContainer.appendChild(rainDrop);
    }
}

// Create snow effect
function createSnowEffect(isDarkMode) {
    const sceneContainer = document.getElementById("scene-container");
    
    for (let i = 0; i < 40; i++) {
        const snowflake = document.createElement("div");
        snowflake.className = "snowflake absolute rounded-full";
        snowflake.style.width = `${Math.random() * 8 + 4}px`;
        snowflake.style.height = snowflake.style.width;
        snowflake.style.left = `${Math.random() * 100}%`;
        snowflake.style.top = `${Math.random() * 100}%`;
        snowflake.style.animationDelay = `${Math.random() * 5}s`;
        snowflake.style.opacity = `${Math.random() * 0.7 + 0.3}`;
        snowflake.style.filter = "blur(1px)";
        snowflake.style.background = isDarkMode
            ? "rgba(255, 255, 255, 0.9)"
            : "rgba(255, 255, 255, 0.8)";
        sceneContainer.appendChild(snowflake);
    }
}

// NEW FUNCTIONS FOR DEFAULT CITIES SECTION

// Create default cities section
function createDefaultCitiesSection() {
    const mainContent = document.querySelector('main');
    
    // Create section element
    const section = document.createElement('div');
    section.className = 'mt-12 fade-in';
    section.id = 'default-cities-section';
    
    section.innerHTML = `
        <h2 class="text-3xl font-bold mb-6 text-center">
            <i class="fas fa-globe-americas mr-2"></i> Weather Around the World
        </h2>
        <div class="weather-card p-6">
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6" id="default-cities-container">
                <!-- Default city cards will be inserted here -->
                <div class="text-center py-8">
                    <div class="loading-spinner inline-block"></div>
                    <p class="mt-4">Loading global weather...</p>
                </div>
            </div>
        </div>
    `;
    
    // Insert before footer
    const footer = document.querySelector('footer');
    mainContent.insertBefore(section, footer);
    
    defaultCitiesContainer = document.getElementById('default-cities-container');
}

// Fetch weather data for all default cities
async function fetchDefaultCitiesWeather() {
    if (!defaultCitiesContainer) return;
    
    // Show loading
    defaultCitiesContainer.innerHTML = `
        <div class="col-span-1 sm:col-span-2 lg:col-span-5 text-center py-8">
            <div class="loading-spinner inline-block"></div>
            <p class="mt-4">Loading global weather...</p>
        </div>
    `;
    
    try {
        const weatherPromises = defaultCities.map(city => 
            fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`)
                .then(response => {
                    if (!response.ok) throw new Error(`Failed to fetch ${city}`);
                    return response.json();
                })
                .catch(error => {
                    console.error(`Error fetching ${city}:`, error);
                    return null;
                })
        );
        
        const weatherData = await Promise.all(weatherPromises);
        
        // Filter out failed requests
        const validData = weatherData.filter(data => data !== null);
        
        // Display the weather cards
        displayDefaultCitiesWeather(validData);
    } catch (error) {
        console.error('Error fetching default cities weather:', error);
        defaultCitiesContainer.innerHTML = `
            <div class="col-span-1 sm:col-span-2 lg:col-span-5 text-center py-8">
                <i class="fas fa-exclamation-triangle text-3xl text-red-500"></i>
                <p class="mt-4">Failed to load global weather data. Please try again later.</p>
            </div>
        `;
    }
}

// Display default cities weather cards
function displayDefaultCitiesWeather(weatherData) {
    if (!defaultCitiesContainer || weatherData.length === 0) return;
    
    defaultCitiesContainer.innerHTML = '';
    
    weatherData.forEach(data => {
        if (!data) return;
        
        const tempCelsius = Math.round(data.main.temp);
        const condition = data.weather[0].description;
        const iconCode = data.weather[0].icon;
        const iconClass = getWeatherIcon(iconCode);
        
        const cityCard = document.createElement('div');
        cityCard.className = 'default-city-card detail-card cursor-pointer';
        cityCard.onclick = () => searchCity(data.name);
        
        cityCard.innerHTML = `
            <div class="flex flex-col items-center">
                <div class="flex items-center justify-between w-full mb-3">
                    <div class="text-left">
                        <h3 class="font-bold text-lg">${data.name}</h3>
                        <p class="text-sm opacity-70">${data.sys.country}</p>
                    </div>
                    <i class="fas fa-${iconClass} text-2xl"></i>
                </div>
                
                <div class="text-center w-full">
                    <div class="text-3xl font-bold mb-2">${tempCelsius}°C</div>
                    <p class="text-sm capitalize mb-3">${condition}</p>
                    
                    <div class="grid grid-cols-2 gap-2 mt-3">
                        <div class="text-center">
                            <i class="fas fa-wind text-sm opacity-70"></i>
                            <p class="text-xs mt-1">${data.wind.speed} m/s</p>
                        </div>
                        <div class="text-center">
                            <i class="fas fa-tint text-sm opacity-70"></i>
                            <p class="text-xs mt-1">${data.main.humidity}%</p>
                        </div>
                    </div>
                    
                    <button class="mt-4 w-full py-2 text-sm rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transition-all duration-300 text-white font-medium">
                        View Details
                    </button>
                </div>
            </div>
        `;
        
        defaultCitiesContainer.appendChild(cityCard);
    });
}

// Add CSS for default city cards
const style = document.createElement('style');
style.textContent = `
    .default-city-card {
        transition: all 0.3s ease;
        height: 100%;
    }
    
    .default-city-card:hover {
        transform: translateY(-8px) scale(1.02);
    }
    
    body.light-mode .default-city-card {
        background: rgba(255, 255, 255, 0.7);
        border: 1px solid rgba(255, 255, 255, 0.4);
    }
    
    body.dark-mode .default-city-card {
        background: rgba(30, 41, 59, 0.7);
        border: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    #default-cities-section h2 {
        position: relative;
        display: inline-block;
    }
    
    #default-cities-section h2::after {
        content: '';
        position: absolute;
        bottom: -10px;
        left: 50%;
        transform: translateX(-50%);
        width: 100px;
        height: 3px;
        background: linear-gradient(to right, #667eea, #764ba2);
        border-radius: 2px;
    }
`;
document.head.appendChild(style);