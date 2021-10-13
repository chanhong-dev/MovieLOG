import hashlib
import json
import os

import jwt
from pymongo import MongoClient
from datetime import datetime, timedelta
import datetime
from flask import Flask, render_template, jsonify, request
import urllib.request
app = Flask(__name__)

# 테스트 로컬
client = MongoClient('localhost', 27017)
client_id = "5Dvd8sOK7To6qEiPRBT9"
client_pw = "gNJwKPtZyX"
SECRET_KEY = 'SPARTA'

# 배포
# client = MongoClient(os.environ.get("MONGO_DB_PATH"))
# client_id = os.environ.get("NAVER_CLIENT_ID")
# client_pw = os.environ.get("NAVER_CLIENT_PW")


db = client.movielog


@app.route('/')
def home():
    token_receive = request.cookies.get('mytoken')

    try:
        payload = jwt.decode(token_receive, SECRET_KEY, algorithms=['HS256'])
        user_info = db.user.find_one({"id": payload['id']})

        return render_template('index.html', nickname=user_info["nick"])
    except jwt.ExpiredSignatureError:
        return render_template('login.html')
    except jwt.exceptions.DecodeError:
        return render_template('login.html')


@app.route('/api/movies', methods=['GET'])
def get_movies():
    search_title = request.args.get('movie')
    get_user()
    enc_title = urllib.parse.quote(search_title)
    url = "https://openapi.naver.com/v1/search/movie.json?query="+enc_title

    req = urllib.request.Request(url)
    req.add_header("X-Naver-Client-Id", client_id)
    req.add_header("X-Naver-Client-Secret", client_pw)

    response = urllib.request.urlopen(req)
    # print("영화 제목 {} 검색 불가".format(title))

    res_code = response.getcode()

    if res_code == 200:  # 200 OK 이면
        response_body = response.read()
        movie_list = response_body.decode('utf-8')
        json_movie_lists = json.loads(movie_list)

    return jsonify(json_movie_lists['items'])


@app.route('/api/reviews', methods=['GET'])
def get_reviews():
    search_title = request.args.get('title')
    reviews = list(db.moviereview.find({'title': search_title}, {'_id': False}))

    return jsonify(reviews)


@app.route('/api/review', methods=['POST'])
def save_reviews():
    title_receive = request.form['title']
    review_receive = request.form['review']

    doc = {
        'title': title_receive,
        'review': review_receive
    }

    db.moviereview.insert_one(doc)

    return jsonify({'success': '리뷰 저장 완료!'})


@app.route('/api/confirm-like', methods=['GET'])
def get_like():
    search_title = request.args.get('title')

    preference = db.likedislike.find_one({'title': search_title}, {'_id': False})

    if preference is None:
        return jsonify({'result': 0})
    else:
        return jsonify(preference)


@app.route('/api/new-like', methods=['POST'])
def save_like():
    title_receive = request.form['title']

    doc = {
        'title': title_receive,
        'like': 1,
        'dislike': 0
    }

    db.likedislike.insert_one(doc)

    return jsonify({'success': '좋아요!'})


@app.route('/api/update-like', methods=['POST'])
def update_like():
    title_receive = request.form['title']
    like_receive = request.form['like']

    current_like = int(like_receive) + 1

    db.likedislike.update_one({'title': title_receive}, {'$set': {'like': current_like}})

    return jsonify({'success': '좋아요!'})


@app.route('/api/confirm-dislike', methods=['GET'])
def get_dislike():
    search_title = request.args.get('title')

    preference = db.likedislike.find_one({'title': search_title}, {'_id': False})

    if preference is None:
        return jsonify({'result': 0})
    else:
        return jsonify(preference)


@app.route('/api/new-dislike', methods=['POST'])
def save_dislike():
    title_receive = request.form['title']

    doc = {
        'title': title_receive,
        'like': 0,
        'dislike': 1
    }

    db.likedislike.insert_one(doc)

    return jsonify({'success': '싫어요!'})


@app.route('/api/update-dislike', methods=['POST'])
def update_dislike():
    title_receive = request.form['title']
    dislike_receive = request.form['dislike']

    current_dislike = int(dislike_receive) + 1

    db.likedislike.update_one({'title': title_receive}, {'$set': {'dislike': current_dislike}})

    return jsonify({'success': '싫어요!'})


@app.route('/api/rank-review', methods=['GET'])
def get_rank_review():
    rank_review = list(db.moviereview.aggregate(
        [
            {
                "$sortByCount": "$title"
            }
        ]
    ))
    return jsonify(rank_review)


@app.route('/api/rank-like', methods=['GET'])
def get_rank_like():
    rank_like = list(db.likedislike.find({}, {'_id': False}).sort("like", -1))

    return jsonify(rank_like)


@app.route('/api/rank-dislike', methods=['GET'])
def get_rank_dislike():
    rank_dislike = list(db.likedislike.find({}, {'_id': False}).sort("dislike", -1))
    return jsonify(rank_dislike)


@app.route('/api/count-like-dislike', methods=['GET'])
def get_count():
    search_title = request.args.get('title')
    like_dislike_count = db.likedislike.find_one({'title': search_title}, {'_id': False})
    if like_dislike_count is None:
        like_dislike_count = {'title': search_title, 'like': 0, 'dislike': 0}

    return jsonify(like_dislike_count)


@app.route('/login')
def login():
    msg = request.args.get("msg")
    return render_template('login.html', msg=msg)


@app.route('/register')
def register():
    return render_template('register.html')


@app.route('/api/register', methods=['POST'])
def api_register():
    id_receive = request.form['id_give']
    pw_receive = request.form['pw_give']
    nickname_receive = request.form['nickname_give']

    pw_hash = hashlib.sha256(pw_receive.encode('utf-8')).hexdigest()

    db.user.insert_one({'id': id_receive, 'pw': pw_hash, 'nick': nickname_receive})

    return jsonify({'result': 'success'})


@app.route('/api/login', methods=['POST'])
def api_login():
    id_receive = request.form['id_give']
    pw_receive = request.form['pw_give']

    pw_hash = hashlib.sha256(pw_receive.encode('utf-8')).hexdigest()

    result = db.user.find_one({'id': id_receive, 'pw': pw_hash})

    if result is not None:

        payload = {
            'id': id_receive,
            'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
        }
        token = jwt.encode(payload, SECRET_KEY, algorithm='HS256')

        return jsonify({'result': 'success', 'token': token})
    else:
        return jsonify({'result': 'fail', 'msg': '아이디/비밀번호가 일치하지 않습니다.'})


@app.route('/api/nick', methods=['GET'])
def api_valid():
    token_receive = request.cookies.get('mytoken')

    try:
        payload = jwt.decode(token_receive, SECRET_KEY, algorithms=['HS256'])
        print(payload)
        userinfo = db.user.find_one({'id': payload['id']}, {'_id': 0})
        return jsonify({'result': 'success', 'nickname': userinfo['nick']})
    except jwt.ExpiredSignatureError:

        return jsonify({'result': 'fail', 'msg': '로그인 시간이 만료되었습니다.'})
    except jwt.exceptions.DecodeError:
        return jsonify({'result': 'fail', 'msg': '로그인 정보가 존재하지 않습니다.'})


# 로그인된 유저정보 가져오기
def get_user():
    token_receive = request.cookies.get('mytoken')
    payload = jwt.decode(token_receive, SECRET_KEY, algorithms=['HS256'])
    userinfo = db.user.find_one({'id': payload['id']}, {'_id': 0})
    print(userinfo)


if __name__ == '__main__':
    app.run('0.0.0.0', port=5000, debug=True)
