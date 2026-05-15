from pymongo import MongoClient
from config import MONGO_URI
from datetime import datetime, timezone

client = MongoClient(MONGO_URI)
db = client.energy_forecasting
users_collection = db.users


def create_user(name, email, password_hash, role="user"):
    user = {
        "name": name,
        "email": email,
        "password_hash": password_hash,
        "role": role,
        "created_at": datetime.now(timezone.utc),
    }
    result = users_collection.insert_one(user)
    return str(result.inserted_id)


def find_user_by_email(email):
    return users_collection.find_one({"email": email})


def find_user_by_id(user_id):
    from bson import ObjectId
    return users_collection.find_one({"_id": ObjectId(user_id)})


def get_all_users():
    return list(users_collection.find({}, {"password_hash": 0}))


def delete_user(user_id):
    from bson import ObjectId
    result = users_collection.delete_one({"_id": ObjectId(user_id)})
    return result.deleted_count > 0
