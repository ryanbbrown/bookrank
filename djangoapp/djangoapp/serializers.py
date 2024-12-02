# serializers.py
from rest_framework import serializers
from .models import UserAccount, UserBook, TBRBook, UserRecommendation

class UserAccountSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserAccount
        fields = ['id', 'username', 'password']

class UserBookSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserBook
        fields = ['work_id', 'title', 'author', 'image_url', 'description', 'rating', 'normalized_rating', 'date_added', 'is_ranked']
        # fields = ['id', 'work_id', 'title', 'author', 'image_url','description', 'rating', 'elo_rating', 'RD', 'normalized_rating', 'date_added', 'is_ranked']

class TBRBookSerializer(serializers.ModelSerializer):
    class Meta:
        model = TBRBook
        fields = ['work_id', 'title', 'author', 'image_url', 'date_added']

class UserRecommendationSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserRecommendation
        fields = ['work_id', 'title', 'author', 'description', 'image_url', 'viewed', 'reference_work_id', 'score']


# class SignupSerializer(serializers.ModelSerializer):
#     password = serializers.CharField(write_only=True)

#     class Meta:
#         model = User
#         fields = ['username', 'password'
#         # , 'email'
#         ]

#     def create(self, validated_data):
#         user = User(
#             username=validated_data['username'],
#             # email=validated_data['email']
#         )
#         user.set_password(validated_data['password'])
#         user.save()
#         return user