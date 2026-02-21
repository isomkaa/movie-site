const API_KEY = "a0e4420"; // Note: For production, keep API keys secure on a backend server

// Allow searching by pressing "Enter"
document.getElementById("movieInput").addEventListener("keypress", function(event) {
    if (event.key === "Enter") {
        getMovie();
    }
});

async function getMovie() {
    const movieName = document.getElementById("movieInput").value.trim();
    const resultDiv = document.getElementById("result");

    if (!movieName) {
        resultDiv.innerHTML = "<p class='error'>Please enter a movie name!</p>";
        return;
    }

    resultDiv.innerHTML = "<p>Loading...</p>";

    try {
        // encodeURIComponent ensures spaces/special characters don't break the URL
        const response = await fetch(`https://www.omdbapi.com/?t=${encodeURIComponent(movieName)}&apikey=${API_KEY}`);
        const data = await response.json();

        if (data.Response === "True") {
            resultDiv.innerHTML = `<div class="movie-grid">${createMovieCard(data)}</div>`;
        } else {
            resultDiv.innerHTML = `<p class='error'>Movie not found!</p>`;
        }
    } catch (error) {
        resultDiv.innerHTML = `<p class='error'>Network error. Please try again later.</p>`;
        console.error("Error fetching movie:", error);
    }
}

async function getTopMovies() {
    const resultDiv = document.getElementById("result");
    resultDiv.innerHTML = "<p>Loading top movies...</p>";

    const movies = [
        "The Shawshank Redemption",
        "The Godfather",
        "The Dark Knight",
        "Schindler's List",
        "The Lord of the Rings: The Return of the King",
        "12 Angry Men",
        "Inception",
        "Fight Club"
    ];

    try {
        // Fetch all movies simultaneously for much faster loading
        const fetchPromises = movies.map(movie => 
            fetch(`https://www.omdbapi.com/?t=${encodeURIComponent(movie)}&apikey=${API_KEY}`)
                .then(res => res.json())
        );

        // Wait for all requests to finish
        const results = await Promise.all(fetchPromises);

        // Filter valid responses that meet the rating criteria
        const topMovies = results.filter(data => 
            data.Response === "True" && parseFloat(data.imdbRating) >= 8.5
        );

        let output = `<h2>Top IMDb 8.5+ Movies</h2><div class="movie-grid">`;
        for (let movie of topMovies) {
            output += createMovieCard(movie);
        }
        output += `</div>`;

        resultDiv.innerHTML = output;

    } catch (error) {
        resultDiv.innerHTML = `<p class='error'>Failed to load movies.</p>`;
        console.error("Error fetching top movies:", error);
    }
}

// Helper function to generate the HTML for a movie card
function createMovieCard(data) {
    // Handle missing posters gracefully
    const posterSrc = data.Poster !== "N/A" ? data.Poster : "https://via.placeholder.com/300x450?text=No+Poster";
    
    return `
        <div class="movie-card">
            <img src="${posterSrc}" alt="${data.Title}">
            <div class="movie-info">
                <h3>${data.Title}</h3>
                <p><strong>Year:</strong> ${data.Year}</p>
                <p><strong>⭐ IMDb Rating:</strong> ${data.imdbRating}</p>
                <p><strong>Genre:</strong> ${data.Genre || 'Unknown'}</p>
            </div>
        </div>
    `;
}