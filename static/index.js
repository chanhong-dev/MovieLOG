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
    movie_info['title'] = movie_info['title'].replace("<b>", "").replace("</b>", "")

    let movie_list_html = `<div class="card border-info mb-3" style="max-width: 700px;">
                                        <div class="row g-0" id="movie_info" onclick="detailMovie('${movie_info['title']}','${movie_info['image']}','${movie_info['pubDate']}','${movie_info['director']}','${movie_info['actor']}','${movie_info['userRating']}','${movie_info['link']}','${movie_info['subtitle']}')">
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

function detailMovie(title, image, pubDate, director, actor, userRating,link,subtitle) {
    console.log(title, image, pubDate, director, actor, userRating)
    $("#main_page").hide();
    $("#like-dislike").show();
    let detail_movie_info = `<div class="movie-info card border-light mb-3">
                                        <div class="row g-0">
                                            <div class="col-md-4">
                                                <img src="${image}" class="img-fluid rounded-start" alt="image" style="width:480px; height: 350px">
                                            </div>
                                            <div class="col-md-8" style="padding-left: 2rem;">
                                                <div class="card-body movie-info-wrapper">
                                                    <h2 id="detail_title" class="card-title" style="margin-bottom: auto;">${title}</h2>
                                                    <h4 class="card-title" style="margin-bottom: auto;">${subtitle}</h4>
                                                    <br/>
                                                    <ul class="list" >
                                                        <li class="card-text">${pubDate}</li>
                                                        <li class="card-text">${director}</li>
                                                        <li class="card-text">${actor}</li>
                                                        <li class="card-text">${userRating}</li>
                                                        <a href="${link}" title="네이버 영화 링크">네이버 영화 링크<a>
                                                    </ul>
                                                </div>
                                            </div>
                                        </div>
                                    </div>`
    $("#detail_page").append(detail_movie_info);
    getReviews()
}

function getReviews() {
    let title = $('#detail_title').text()
    $("#reviews").show()
    $.ajax({
        type: "GET",
        url: `/api/reviews?title=${title}`,
        data: {},
        success: function (response) {
            $("#review_list").empty()
            response.forEach(function (review) {
                makeReviewList(review);
            });
        }
    })
}

function saveReview() {
    let title = $('#detail_title').text()
    let review = $('#review_text').val()

    $.ajax({
        type: "POST",
        url: `/api/review`,
        data: {title : title , review : review},
        success: function (response) {
            alert(response["success"]);
            getReviews()
        }
    })
    document.getElementById('review_text').value = '';
}

function makeReviewList(review){
    let review_list_html = `<li style="padding-bottom: 10px">${review['review']}</li>`

    $("#review_list").append(review_list_html);
}

function confirmDataLike(){
    let title = $('#detail_title').text()
    $.ajax({
        type: "GET",
        url: `/api/confirm-like?title=${title}`,
        data: {},
        success: function (response) {
            if(response['result']===0){
                insertLike();
            }
            else{
                updateLike(response['title'],response['like'],response['dislike']);
            }
        }
    })
}

function insertLike(){
    let title = $('#detail_title').text()
    $.ajax({
        type: "POST",
        url: `/api/new-like`,
        data: {title : title},
        success: function (response) {
            alert(response['success']);
        }
    })
}

function updateLike(title, like, dislike ){
    $.ajax({
        type: "POST",
        url: `/api/update-like`,
        data: {title : title , like : like, dislike : dislike},
        success: function (response) {
            alert(response['success']);
        }
    })
}

function rankLike(){
    alert("좋아요 순위")
}

function rankDislike(){
    alert("싫어요 순위")
}

function rankReview(){
    $("#main_page").hide();
    $("#rank-review").empty()
    $("#rank-review").show()
    $("#rank_review").show()
    $.ajax({
        type: "GET",
        url: `/api/rank-review`,
        data: {},
        success: function (response) {
             response.forEach(function (rank_review) {
                makeRankReviewList(rank_review);
            });
        }
    })
}

function makeRankReviewList(rank_review){
    let rank_review_html = `<li class="list-group-item d-flex justify-content-between align-items-center">
                                ${rank_review['_id']}
                                <span class="badge badge-primary badge-pill">${rank_review['count']}개</span>
                            </li>`
    $("#rank-review").append(rank_review_html);
}