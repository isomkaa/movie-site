const API_KEY = "a0e4420"; 
let favorites = JSON.parse(localStorage.getItem('cineFavorites')) || [];

// UI Elements
const searchInput = document.getElementById("movieInput");
const resultDiv = document.getElementById("result");
const loadingDiv = document.getElementById("loading");
const sectionTitle = document.getElementById("section-title");
const modal = document.getElementById("movieModal");
const modalBody = document.getElementById("modal-body");

// Allow "Enter" key to search
searchInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") getMovie();
});

// Hide Modal on outside click
window.onclick = function(event) {
    if (event.target == modal) closeModal();
}

// ----------------------------------------------------
// CORE FETCHING LOGIC
// ----------------------------------------------------

async function getMovie() {
    const query = searchInput.value.trim();
    if (!query) return showToast("Please enter a movie name!", true);

    showLoading("Search Results");

    try {
        // Using 's=' to search for a list of movies rather than just one ('t=')
        const response = await fetch(`https://www.omdbapi.com/?s=${encodeURIComponent(query)}&apikey=${API_KEY}`);
        const data = await response.json();

        if (data.Response === "True") {
            renderGrid(data.Search);
        } else {
            resultDiv.innerHTML = `<h3 class='error' style="grid-column: 1/-1; text-align: center; color: var(--danger);">${data.Error}</h3>`;
        }
    } catch (error) {
        showToast("Network Error!", true);
    } finally {
        hideLoading();
    }
}

async function getTopMovies() {
    showLoading("Top Rated Masterpieces");
    
    // Expanded list for a better grid
    const topTitles = [
        "The Shawshank Redemption", "The Godfather", "The Dark Knight", 
        "Schindler's List", "Pulp Fiction", "Forrest Gump",
        "Inception", "Fight Club", "The Matrix", "Goodfellas",
        "Interstellar", "Gladiator"
    ];

    try {
        const fetchPromises = topTitles.map(title => 
            fetch(`https://www.omdbapi.com/?t=${encodeURIComponent(title)}&apikey=${API_KEY}`).then(res => res.json())
        );

        const results = await Promise.all(fetchPromises);
        const validMovies = results.filter(data => data.Response === "True");
        
        renderGrid(validMovies, true); // True flag indicates these are full detail objects
    } catch (error) {
        showToast("Failed to load top movies.", true);
    } finally {
        hideLoading();
    }
}

// ----------------------------------------------------
// RENDERING LOGIC
// ----------------------------------------------------

function renderGrid(movies, isFullDetail = false) {
    resultDiv.innerHTML = "";
    
    movies.forEach(movie => {
        // Handle cases where the search API returns minimal data vs full data
        const id = movie.imdbID;
        const title = movie.Title;
        const year = movie.Year;
        const posterSrc = movie.Poster !== "N/A" ? movie.Poster : "https://via.placeholder.com/300x450?text=No+Poster";
        const rating = isFullDetail ? movie.imdbRating : "N/A"; // Search API doesn't return rating directly

        const card = document.createElement('div');
        card.className = "movie-card";
        
        // Check if it's already a favorite
        const isFav = favorites.some(fav => fav.imdbID === id);
        const favText = isFav ? "<i class='fas fa-heart-broken'></i> Unfavorite" : "<i class='fas fa-heart'></i> Favorite";

        card.innerHTML = `
            <img src="${posterSrc}" alt="${title}">
            <div class="movie-info">
                <h3>${title}</h3>
                <div class="movie-meta">
                    <span>${year}</span>
                    <span class="rating"><i class="fas fa-star"></i> ${rating !== "N/A" ? rating : '-'}</span>
                </div>
            </div>
            <div class="card-overlay">
                <button class="btn-details" onclick="openMovieDetails('${id}')">View Details</button>
                <button class="btn-fav" onclick="toggleFavorite('${id}', '${title.replace(/'/g, "\\'")}', '${posterSrc}', '${year}')">
                    ${favText}
                </button>
            </div>
        `;
        resultDiv.appendChild(card);
    });
}

// ----------------------------------------------------
// MODAL & DEEP DETAILS LOGIC
// ----------------------------------------------------

async function openMovieDetails(imdbID) {
    modal.classList.remove("hidden");
    modalBody.innerHTML = `<div class="spinner" style="margin: 50px auto;"></div>`;

    try {
        // Fetch full plot and details using the IMDb ID
        const res = await fetch(`https://www.omdbapi.com/?i=${imdbID}&plot=full&apikey=${API_KEY}`);
        const data = await res.json();

        if(data.Response === "True") {
            const posterSrc = data.Poster !== "N/A" ? data.Poster : "https://via.placeholder.com/300x450?text=No+Poster";
            
            modalBody.innerHTML = `
                <img src="${posterSrc}" class="modal-poster" alt="${data.Title}">
                <div class="modal-info">
                    <h2>${data.Title} (${data.Year})</h2>
                    <p class="tagline">${data.Genre} | ${data.Runtime}</p>
                    
                    <div class="modal-badges">
                        <span>⭐ ${data.imdbRating} / 10</span>
                        <span>🍅 ${data.Ratings.find(r => r.Source === "Rotten Tomatoes")?.Value || "N/A"}</span>
                        <span>PG: ${data.Rated}</span>
                    </div>

                    <p class="modal-plot">${data.Plot}</p>
                    
                    <p><strong>Director:</strong> ${data.Director}</p>
                    <p><strong>Cast:</strong> ${data.Actors}</p>
                    <p style="margin-top: 10px; color: var(--accent);"><i class="fas fa-trophy"></i> ${data.Awards}</p>
                </div>
            `;
        }
    } catch (err) {
        modalBody.innerHTML = `<h3 class="error" style="padding: 30px;">Failed to load details.</h3>`;
    }
}

function closeModal() {
    modal.classList.add("hidden");
}

// ----------------------------------------------------
// FAVORITES LOGIC
// ----------------------------------------------------

function toggleFavorite(id, title, poster, year) {
    const existsIndex = favorites.findIndex(fav => fav.imdbID === id);
    
    if (existsIndex > -1) {
        favorites.splice(existsIndex, 1);
        showToast("Removed from Favorites!");
    } else {
        favorites.push({ imdbID: id, Title: title, Poster: poster, Year: year });
        showToast("Added to Favorites!");
    }

    localStorage.setItem('cineFavorites', JSON.stringify(favorites));
    
    // If we are currently viewing the favorites page, re-render it
    if (sectionTitle.innerText === "Your Favorites") {
        showFavorites();
    } else {
        // Otherwise, just re-trigger the current view to update the buttons
        // This is a simple hack; a proper framework like React handles this better.
        const currentSearch = searchInput.value.trim();
        if (currentSearch && sectionTitle.innerText === "Search Results") {
            getMovie();
        } else if (sectionTitle.innerText === "Top Rated Masterpieces") {
            getTopMovies();
        }
    }
}

function showFavorites() {
    sectionTitle.innerText = "Your Favorites";
    if (favorites.length === 0) {
        resultDiv.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: var(--text-muted); font-size: 18px;">You haven't saved any favorites yet.</p>`;
        return;
    }
    renderGrid(favorites);
}

// ----------------------------------------------------
// UTILITIES
// ----------------------------------------------------

function showLoading(title) {
    sectionTitle.innerText = title;
    resultDiv.innerHTML = "";
    loadingDiv.classList.remove("hidden");
}

function hideLoading() {
    loadingDiv.classList.add("hidden");
}

function showToast(message, isError = false) {
    const toast = document.getElementById("toast");
    toast.innerText = message;
    toast.style.background = isError ? "var(--danger)" : "var(--accent)";
    toast.style.color = isError ? "white" : "black";
    toast.classList.remove("hidden");
    
    setTimeout(() => {
        toast.classList.add("hidden");
    }, 3000);
}

// Load Top Movies on initial start
window.onload = getTopMovies;