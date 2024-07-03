# serializers.py
from rest_framework import serializers
from .models import UserAccount, UserBookRating, UserToBeRead, UserRecommendation

class UserAccountSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserAccount
        fields = ['id', 'username', 'password']

class UserBookRatingSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserBookRating
        fields = ['id', 'work_id', 'title', 'author', 'description', 'image_url', 'rating', 'elo_rating', 'RD', 'normalized_rating', 'date_added', 'is_ranked']

class UserToBeReadSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserToBeRead
        fields = ['id', 'work_id', 'title', 'author']

class UserRecommendationSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserRecommendation
        fields = ['id', 'work_id', 'title', 'author', 'description', 'image_url', 'viewed', 'reference_work_id', 'score']