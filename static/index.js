function getMovies() {
    let movie_title = $('#movie_name').val()
    $.ajax({
        type: "GET",
        url: `/api/movies?movie=${movie_title}`,
        data: {},
        success: function (response) {
            $("#search_movie_lists").empty()
            response.forEach(function (movie_list) {
                makeMovieList(movie_list);
            });
        }
    })
}

function makeMovieList(movie_info) {
    movie_info['title'] = movie_info['title'].replace("<b>","").replace("</b>","")

    let movie_list_html = `<div class="card border-info mb-3" style="max-width: 700px;">
                                        <div class="row g-0" id="movie_info">
                                            <div class="col-md-4">
                                                <img src="${movie_info['image']}" class="img-fluid rounded-start" alt="..." >
                                            </div>
                                            <div class="col-md-8">
                                                <div class="card-body">
                                                    <h5 class="card-title">${movie_info['title']}</h5>
                                                    <p class="card-text">${movie_info['subtitle']}</p>
                                                    <p class="card-text"><small class="text-muted">좋아요 / 싫어요 </small></p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>`
    $("#search_movie_lists").append(movie_list_html);
}
