import hashlib
import json
import os

import jwt
from pymongo import MongoClient
from datetime import datetime, timedelta

from flask import Flask, render_template, jsonify, request
import urllib.request
from urllib import request as r

import user_validation as validation

application = Flask(__name__)

# 테스트 로컬
client = MongoClient('localhost', 27017)
client_id = "5Dvd8sOK7To6qEiPRBT9"
client_pw = "gNJwKPtZyX"
SECRET_KEY = 'SPARTA'

# user_validation.py db경로도 바꿔주어야 함.

# 배포
#client = MongoClient(os.environ.get("MONGO_DB_PATH"))
#client_id = os.environ.get("NAVER_CLIENT_ID")
#client_pw = os.environ.get("NAVER_CLIENT_PW")
#SECRET_KEY = os.environ.get("SECRET_KEY")

db = client.movielog


@application.route('/')
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



@application.route('/api/movies', methods=['GET'])
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


@application.route('/api/reviews', methods=['GET'])
def get_reviews():
    search_title = request.args.get('title')
    reviews = list(db.moviereview.find({'title': search_title}, {'_id': False}))
    return jsonify(reviews)


@application.route('/api/review', methods=['POST'])
def save_reviews():
    title_receive = request.form['title']
    review_receive = request.form['review']
    user = get_user()
    doc = {
        'id': user['id'],
        'title': title_receive,
        'review': review_receive
    }

    db.moviereview.insert_one(doc)
    return jsonify({'success': '리뷰 저장 완료!'})


@application.route('/api/delete-review', methods=['POST'])
def delete_review():
    title_receive = request.form['title']
    review_receive = request.form['review']
    user = get_user()
    db.moviereview.delete_one({'id': user['id'], 'title': title_receive, 'review': review_receive})

    return jsonify({"result": "success"})


@application.route('/api/confirm-like', methods=['GET'])
def get_like():
    search_title = request.args.get('title')
    preference = db.likedislike.find_one({'title': search_title}, {'_id': False})
    # 유저가 이미 등록했는지 확인
    user = get_user()
    userlike = db.userlike.find_one({'id':user['id'], 'title': search_title})
    if userlike is None:
        db.userlike.save({'id':user['id'], 'title': search_title, 'type': "like"})
        if preference is None:
            return jsonify({'result': 0})
        else:
            return jsonify(preference)
    elif userlike['type'] == 'like':
        return jsonify({'result': 1})
    else:
        db.userlike.update_one({"id": user['id'], 'title': search_title}, {'$set': {'type': "like"}})
        db.likedislike.update_one({'title': search_title}, {'$set': {'dislike': preference['dislike']-1,
                                                                     'like': preference['like']+1}})
        return jsonify({'result': 0})


@application.route('/api/new-like', methods=['POST'])
def save_like():
    title_receive = request.form['title']
    doc = {
        'title': title_receive,
        'like': 1,
        'dislike': 0
    }
    db.likedislike.insert_one(doc)
    return jsonify({'success': '좋아요!'})


@application.route('/api/update-like', methods=['POST'])
def update_like():
    title_receive = request.form['title']
    like_receive = request.form['like']
    current_like = int(like_receive) + 1
    db.likedislike.update_one({'title': title_receive}, {'$set': {'like': current_like}})
    return jsonify({'success': '좋아요!'})


@application.route('/api/confirm-dislike', methods=['GET'])
def get_dislike():
    search_title = request.args.get('title')
    preference = db.likedislike.find_one({'title': search_title}, {'_id': False})
    # 유저가 이미 등록했는지 확인
    user = get_user()
    userlike = db.userlike.find_one({'id':user['id'], 'title': search_title})
    if userlike is None:
        db.userlike.save({'id':user['id'], 'title': search_title, 'type': "dislike"})
        if preference is None:
            return jsonify({'result': 0})
        else:
            return jsonify(preference)
    elif userlike['type']=='dislike':
        return jsonify({'result': 1})
    else:
        db.userlike.update_one({"id": user['id'],'title': search_title},{'$set': {'type': "dislike"}})
        db.likedislike.update_one({'title': search_title}, {'$set':{'dislike': preference['dislike']+1,
                                                                'like': preference['like']-1}})
        return jsonify({'result':0})


@application.route('/api/new-dislike', methods=['POST'])
def save_dislike():
    title_receive = request.form['title']
    doc = {
        'title': title_receive,
        'like': 0,
        'dislike': 1
    }
    db.likedislike.insert_one(doc)
    return jsonify({'success': '싫어요!'})


@application.route('/api/update-dislike', methods=['POST'])
def update_dislike():
    title_receive = request.form['title']
    dislike_receive = request.form['dislike']
    current_dislike = int(dislike_receive) + 1
    db.likedislike.update_one({'title': title_receive}, {'$set': {'dislike': current_dislike}})
    return jsonify({'success': '싫어요!'})


@application.route('/api/rank-review', methods=['GET'])
def get_rank_review():
    rank_review = list(db.moviereview.aggregate(
        [
            {
                "$sortByCount": "$title"
            }
        ]
    ))
    return jsonify(rank_review)


@application.route('/api/rank-like', methods=['GET'])
def get_rank_like():
    rank_like = list(db.likedislike.find({}, {'_id': False}).sort("like", -1))
    return jsonify(rank_like)


@application.route('/api/rank-dislike', methods=['GET'])
def get_rank_dislike():
    rank_dislike = list(db.likedislike.find({}, {'_id': False}).sort("dislike", -1))
    return jsonify(rank_dislike)


@application.route('/api/count-like-dislike', methods=['GET'])
def get_count():
    search_title = request.args.get('title')
    like_dislike_count = db.likedislike.find_one({'title': search_title}, {'_id': False})
    if like_dislike_count is None:
        like_dislike_count = {'title': search_title, 'like': 0, 'dislike': 0}
    return jsonify(like_dislike_count)


@application.route('/api/today-rank', methods=['GET'])
def get_today_rank():
    country_title = request.args.get('country')
    yesterday = (datetime.today() - timedelta(1)).strftime("%Y%m%d")
    print(yesterday)
    if country_title == 'ko':
        url2 = "https://kobis.or.kr/kobisopenapi/webservice/rest/boxoffice/searchDailyBoxOfficeList.json?repNationCd=K&key=039485c038f20e231e30fdd8e084b8e9&targetDt=" + yesterday
    else:
        url2 = "https://kobis.or.kr/kobisopenapi/webservice/rest/boxoffice/searchDailyBoxOfficeList.json?repNationCd=F&key=039485c038f20e231e30fdd8e084b8e9&targetDt=" + yesterday
    req2 = r.Request(url2)
    response = r.urlopen(req2)
    # print("영화 제목 {} 검색 불가".format(title))
    res_code = response.getcode()
    if res_code == 200:  # 200 OK 이면
        response_body = response.read()
        movie_list = response_body.decode('utf-8')
        json_movie_lists = json.loads(movie_list)
        rank = json_movie_lists['boxOfficeResult']
        print(rank['dailyBoxOfficeList'])
    return jsonify(rank['dailyBoxOfficeList'])


@application.route('/login')
def login():
    msg = request.args.get("msg")
    return render_template('login.html', msg=msg)


@application.route('/register')
def register():
    return render_template('register.html')


@application.route('/api/register', methods=['POST'])
def api_register():
    id_receive = request.form['id_give'].strip()
    pw_receive = request.form['pw_give'].strip()
    pw_check_receive = request.form['pw_check_give'].strip()
    nickname_receive = request.form['nickname_give'].strip()

    validation_id = validation.validate_id(id_receive)
    exisiting_id = validation.is_exist_id(id_receive)
    validation_pw = validation.validate_pw(pw_receive,pw_check_receive)
    exisiting_nickname = validation.is_exist_nickname(nickname_receive)
    # 로그인 가능
    if validation_id and validation_pw and not exisiting_id and not exisiting_nickname and len(nickname_receive) != 0:
        pw_hash = hashlib.sha256(pw_receive.encode('utf-8')).hexdigest()
        db.user.insert_one({'id': id_receive, 'pw': pw_hash, 'nick': nickname_receive})
        return jsonify({'result': 'success'})
    
    # 로그인 실패
    if not validation_id:
        return jsonify({'result': "failure", 'msg': "아이디가 올바르지 않은 형식입니다."})
    elif exisiting_id:
        return jsonify({'result': "failure", 'msg': "이미 존재하는 아이디입니다"})
    elif not validation_pw:
        return jsonify({'result': "failure", 'msg': "입력된 두 비밀번호가 일치하지 않습니다."})
    elif exisiting_nickname:
        return jsonify({'result': "failure", 'msg': "이미 존재하는 닉네임입니다."})
    elif len(nickname_receive)!=0:
        return jsonify({'result': "failure", 'msg': "올바르지 않은 닉네임입니다."})


@application.route('/api/login', methods=['POST'])
def api_login():
    id_receive = request.form['id_give']
    pw_receive = request.form['pw_give']

    pw_hash = hashlib.sha256(pw_receive.encode('utf-8')).hexdigest()

    result = db.user.find_one({'id': id_receive, 'pw': pw_hash})

    if result is not None:

        payload = {
            'id': id_receive,
            'exp': datetime.utcnow() + timedelta(hours=24)
        }
        token = jwt.encode(payload, SECRET_KEY, algorithm='HS256')

        return jsonify({'result': 'success', 'token': token})
    else:
        return jsonify({'result': 'fail', 'msg': '아이디/비밀번호가 일치하지 않습니다.'})


@application.route('/api/nick', methods=['GET'])
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

    return userinfo


@application.route('/api/show-bookmark', methods=['GET'])
def show_bookmark():
    user = get_user()

    bookmarks = list(db.bookmark.find({'id': user['id']}, {'_id': False}))

    return jsonify(bookmarks)


@application.route('/api/add-bookmark', methods=['POST'])
def add_bookmark():
    title_receive = request.form['title']
    link_receive = request.form['link']
    user = get_user()
    doc = {
        'id': user['id'],
        'title': title_receive,
        'link': link_receive
    }
    bookmarks = db.bookmark.find({'id': user['id'], 'title': title_receive}, {'_id': False}).count()

    if bookmarks == 0:
        db.bookmark.insert_one(doc)

    return jsonify({'success': '즐겨찾기 추가 완료!'})


@application.route('/api/delete-bookmark', methods=['POST'])
def delete_bookmark():
    title_receive = request.form['title']
    user = get_user()

    db.bookmark.delete_one({'id': user['id'], 'title': title_receive})
    return jsonify({'success': '즐겨찾기 삭제 완료!'})


@application.route('/api/get-bookmark', methods=['GET'])
def get_bookmark():
    user = get_user()
    search_title = request.args.get('title')
    bookmark = (db.bookmark.find({'id': user['id'], 'title': search_title}, {'_id': False})).count()

    if bookmark == 0:
        return jsonify({'result': 0})
    else:
        return jsonify({'result': 1})



if __name__ == '__main__':
    application.debug = True
    application.run()


