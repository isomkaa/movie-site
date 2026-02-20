async function getMovie() {
    const movieName = document.getElementById("movieInput").value;

    const response = await fetch(`https://www.omdbapi.com/?t=${movieName}&apikey=a0e4420`);
    const data = await response.json();

    if (data.Response === "True") {
        document.getElementById("result").innerHTML = `
            <h2>${data.Title}</h2>
            <p>Year: ${data.Year}</p>
            <p>IMDb Rating: ${data.imdbRating}</p>
            <p>Genre: ${data.Genre}</p>
            <img src="${data.Poster}" width="200">
        `;
    } else {
        document.getElementById("result").innerHTML = "Movie not found!";
    }
}
async function getTopMovies() {
    const resultDiv = document.getElementById("result");
    resultDiv.innerHTML = "Loading...";

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

    let output = "<h2>Top IMDb 8.5+ Movies</h2>";

    for (let movie of movies) {
        const response = await fetch(`https://www.omdbapi.com/?t=${movie}&apikey=a0e4420`);
        const data = await response.json();

        if (data.Response === "True" && parseFloat(data.imdbRating) >= 8.5) {
            output += `
                <div style="margin-bottom:20px;">
                    <h3>${data.Title}</h3>
                    <p>Year: ${data.Year}</p>
                    <p>IMDb Rating: ${data.imdbRating}</p>
                    <img src="${data.Poster}" width="150">
                </div>
            `;
        }
    }

    resultDiv.innerHTML = output;
}