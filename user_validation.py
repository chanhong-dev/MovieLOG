from flask.scaffold import F
from pymongo import MongoClient
from pymongo import MongoClient


client = MongoClient('localhost', 27017)
db = client.movielog

#user id가 영어/숫자 조합인지 확인
def validate_id(user_id):
    if len(user_id)==0:
        return False
    for character in user_id:
        if(not character.isalnum()):
            return False
    return True

#password 두개 모두 같은 비밀번호인지
def validate_pw(user_pw, user_pw_check):
    if len(user_pw)==0:
        return False
    return user_pw.strip()==user_pw_check.strip()

#이미 있는 id인지 확인
def is_exist_id(user_id):
    global db
    return db.user.find_one({'id': user_id})!=None

#이미 있는 nickname인지 확인
def is_exist_nickname(user_nickname):
    global db
    return db.user.find_one({'nick': user_nickname})!=None
    


