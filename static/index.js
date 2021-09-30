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
                                                <div class="card-body" id="movie-info">
                                                    <h5 class="card-title" style="font-weight: bolder">${movie_info['title']}</h5>
                                                    <p class="card-text">${movie_info['subtitle']}</p>
                                                    <span style="padding-right: 10px; font-weight: bold; color: blue">${movie_info['userRating']}</span>
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
                                                        <li class="card-text">개봉 >${pubDate}</li>
                                                        <li class="card-text">감독 >${director}</li>
                                                        <li class="card-text">배우 >${actor}</li>
                                                        <li class="card-text">평점 >${userRating}</li>
                                                        <a href="${link}" title="자세히 보기">자세히 보기<a>
                                                    </ul>
                                                </div>
                                            </div>
                                        </div>
                                    </div>`
    $("#detail_page").append(detail_movie_info);
    getReviews()
    getCount(title)
}

function getCount(title){
    $.ajax({
        type: "GET",
        url: `/api/count-like-dislike?title=${title}`,
        data: {},
        success: function (response) {
            $("#count-like").text(response['like'])
            $("#count-dislike").text(response['dislike'])
        }
    })
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
            getCount(title)
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

function confirmDataDislike(){
    let title = $('#detail_title').text()
    $.ajax({
        type: "GET",
        url: `/api/confirm-dislike?title=${title}`,
        data: {},
        success: function (response) {
            if(response['result']===0){
                insertdisLike();
            }
            else{
                updatedisLike(response['title'],response['like'],response['dislike']);
            }
            getCount(title)
        }
    })
}

function insertdisLike(){
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

function updatedisLike(title, like, dislike ){
    $.ajax({
        type: "POST",
        url: `/api/update-dislike`,
        data: {title : title , like : like, dislike : dislike},
        success: function (response) {
            alert(response['success']);
        }
    })
}

function rankLike(){
    $('#rank-list').empty()
    $('#main_page').hide()
    $('#rank-list').show()
    $('#rank_like').show()
    $("#rank_review").hide()
    $('#rank_dislike').hide()
    $('#detail_page').hide()
    $('#reviews').hide()
    $('#like-dislike').hide()
    $.ajax({
        type: "GET",
        url: `/api/rank-like`,
        data: {},
        success: function (response) {
            response.forEach(function (rank_like) {
                makeRankLikeList(rank_like);
            });
        }
    })
}

function rankDislike() {
    $("#main_page").hide();
    $("#rank-list").empty()
    $("#rank-list").show()
    $("#rank_review").hide()
    $('#rank_like').hide()
    $("#rank_dislike").show()
    $('#detail_page').hide()
    $('#reviews').hide()
    $('#like-dislike').hide()
    $.ajax({
        type: "GET",
        url: `/api/rank-Dislike`,
        data: {},
        success: function (response) {
            response.forEach(function (rank_Dislike) {
                makeRankDislikeList(rank_Dislike);
            });
        }
    })
}


function rankReview(){
    $("#main_page").hide();
    $("#rank-list").empty()
    $("#rank-list").show()
    $("#rank_review").show()
    $('#rank_like').hide()
    $('#rank_dislike').hide()
    $('#detail_page').hide()
    $('#reviews').hide()
    $('#like-dislike').hide()
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
                                <span class="badge badge-primary badge-pill">리뷰 ${rank_review['count']}개</span>
                            </li>`
    $("#rank-list").append(rank_review_html);
}

function makeRankLikeList(rank_like){
    let rank_like_html = `<li class="list-group-item d-flex justify-content-between align-items-center">
                                ${rank_like['title']}
                                <span class="badge badge-primary badge-pill">좋아요 ${rank_like['like']}개</span>
                            </li>`
    $("#rank-list").append(rank_like_html);
}

function makeRankDislikeList(rank_dislike) {
    let rank_dislike_html = `<li class="list-group-item d-flex justify-content-between align-items-center">
                                ${rank_dislike['title']}
                                <span class="badge badge-primary badge-pill">싫어요 ${rank_dislike['dislike']}개</span>
                            </li>`
    $("#rank-list").append(rank_dislike_html);
}

