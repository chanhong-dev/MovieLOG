import json

from flask import Flask, render_template, jsonify, request
import urllib.request
app = Flask(__name__)

from pymongo import MongoClient
client = MongoClient('localhost', 27017)


@app.route('/')
def home():
    return render_template('index.html')


@app.route('/api/movies', methods=['GET'])
def get_movies():
    title = request.args.get('movie')

    client_id = "5Dvd8sOK7To6qEiPRBT9"
    client_pw = "gNJwKPtZyX"
    enc_text = urllib.parse.quote(title)
    url = "https://openapi.naver.com/v1/search/movie.json?query="+enc_text
    # # API URL에 query와 패러미터를 추가한 url
    req = urllib.request.Request(url)
    req.add_header("X-Naver-Client-Id", client_id)
    req.add_header("X-Naver-Client-Secret", client_pw)  # header로 id와 secret 추가

    response = urllib.request.urlopen(req)
    # 객체를 매개변수로 request.urlopen을 호출해 Web 서버에 요청
    # print("영화 제목 {} 검색 불가".format(title))

    res_code = response.getcode()  # response의 코드

    if (res_code == 200):  # 200 OK 이면
        response_body = response.read()
        movie_list = response_body.decode('utf-8')
        json_movie_lists = json.loads(movie_list)

    return jsonify(json_movie_lists['items'])


if __name__ == '__main__':
    app.run('0.0.0.0', port=5000, debug=True)
