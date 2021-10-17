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
    let movie_list_html = `
        <div class="card border-info mb-3" style="max-width: 700px;">
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

function detailMovie(title, image, pubDate, director, actor, userRating, link, subtitle) {
    $("#main_page").hide();
    $("#like-dislike").show();
    let detail_movie_info = `
        <div class="movie-info card border-light mb-3">
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

function getCount(title) {
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
        data: {title: title, review: review},
        success: function (response) {
            alert(response["success"]);
            getReviews()
        }
    })
    document.getElementById('review_text').value = '';
}

function makeReviewList(review) {
    let review_list_html = `<li style="padding-bottom: 10px">${review['review']}</li>`

    $("#review_list").append(review_list_html);
}

function confirmDataLike() {
    let title = $('#detail_title').text()
    $.ajax({
        type: "GET",
        url: `/api/confirm-like?title=${title}`,
        data: {},
        success: function (response) {
            if (response['result'] === 0) {
                insertLike();
            } else if(response['result']===1){
                alert("이미 좋아요를 눌르셨습니다");
            } else {
                updateLike(response['title'], response['like'], response['dislike']);
            }
            getCount(title)
        }
    })
}

function insertLike() {
    let title = $('#detail_title').text()
    $.ajax({
        type: "POST",
        url: `/api/new-like`,
        data: {title: title},
        success: function (response) {
            alert(response['success']);
        }
    })
}

function confirmDataDislike() {
    let title = $('#detail_title').text()
    $.ajax({
        type: "GET",
        url: `/api/confirm-dislike?title=${title}`,
        data: {},
        success: function (response) {
            if (response['result'] === 0) {
                insertDisLike();
            }else if(response['result']===1){
                alert("이미 싫어요를 누르셨습니다.")
            } else {
                updateDisLike(response['title'], response['like'], response['dislike']);
            }
            getCount(title)
        }
    })
}

function updateLike(title, like, dislike) {
    $.ajax({
        type: "POST",
        url: `/api/update-like`,
        data: {title: title, like: like, dislike: dislike},
        success: function (response) {
            alert(response['success']);
        }
    })
}

function insertDisLike() {
    let title = $('#detail_title').text()
    $.ajax({
        type: "POST",
        url: `/api/new-dislike`,
        data: {title: title},
        success: function (response) {
            alert(response['success']);
        }
    })
}

function updateDisLike(title, like, dislike) {
    $.ajax({
        type: "POST",
        url: `/api/update-dislike`,
        data: {title: title, like: like, dislike: dislike},
        success: function (response) {
            alert(response['success']);
        }
    })
}

function rankLike() {
    $("#this-is-title").text("😛좋아요 랭킹😛")
    $('#rank-list').empty().show()
    $('#main_page').hide()
    $('#detail_page').hide()
    $('#reviews').hide()
    $('#like-dislike').hide()
    $.ajax({
        type: "GET",
        url: `/api/rank-like`,
        data: {},
        success: function (response) {
            response.forEach(function (rank) {
                makeRankList(rank, 'like');
            });
        }
    })
}

function rankDislike() {
    $("#this-is-title").text("🥵싫어요 랭킹🥵")
    $("#main_page").hide();
    $("#rank-list").empty().show()
    $('#detail_page').hide()
    $('#reviews').hide()
    $('#like-dislike').hide()
    $.ajax({
        type: "GET",
        url: `/api/rank-dislike`,
        data: {},
        success: function (response) {
            response.forEach(function (rank) {
                makeRankList(rank, 'dislike');
            });
        }
    })
}


function rankReview() {
    $("#this-is-title").text("⭐리뷰 랭킹⭐")
    $("#main_page").hide();
    $("#rank-list").empty().show()
    $('#detail_page').hide()
    $('#reviews').hide()
    $('#like-dislike').hide()
    $.ajax({
        type: "GET",
        url: `/api/rank-review`,
        data: {},
        success: (response) => {
            response.forEach(function (rank_review) {
                makeRankList(rank_review, 'review');
            });
        }
    })
}

function makeRankList(rank, type) {
    let count
    let typeText
    let title
    if (type === 'review') {
        title = rank['_id']
        count = rank['count']
        typeText = "리뷰"
    } else if (type === 'like') {
        title = rank['title']
        typeText = "좋아요"
        count = rank['like']
    } else if (type === 'dislike') {
        title = rank['title']
        typeText = "싫어요"
        count = rank['dislike']
    }
    let tmpHtml = `
        <li class="list-group-item d-flex justify-content-between align-items-center">
            ${title}
            <span class="badge badge-primary badge-pill">${typeText} ${count}개</span>
        </li>`
    $("#rank-list").append(tmpHtml);
}


function get_today_rank(con) {
    $("#table").show();
    $("#rank-list").empty().show();
    $("#main_page").hide();
    let country = con === 'ko' ? '🎬한국' : '🎬외국'
    $("#this-is-title").text(`${country} 영화 실시간 박스오피스 순위🎬`)
    $('#detail_page').hide()
    $('#reviews').hide()
    $('#like-dislike').hide()
    $.ajax({
        type: "GET",
        url: `/api/today-rank?country=${con}`,
        data: {},
        success: function (response) {
            response.forEach(function (get_ko_rank) {
                makeToRankList(get_ko_rank);
            });
        }
    })
}

function makeToRankList(get_ko_rank) {
    let get_rank_html = `

            <tr>
            <td>${get_ko_rank['rank']}위</td>
            <td>${get_ko_rank['movieNm']} <span style=" color:red; font-size:x-small; font-weight: 900;">${get_ko_rank['rankOldAndNew']==="NEW" ? "NEW" :  ""}</span></td>
            <td>${get_ko_rank['openDt']}</td>           
            <td>${Number(get_ko_rank['audiAcc']).toLocaleString("ko-KR")} 명</td>  
                      
                </tr>
`
    $("#rank-list").append(get_rank_html);

}