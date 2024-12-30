# serializers.py
from rest_framework import serializers
from .models import UserAccount, UserBook, TBRBook, UserRecommendation, Book


## MODEL SERIALIZERS
class UserAccountSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserAccount
        fields = ['id', 'username', 'nonfiction_ranked_books_count', 'fiction_ranked_books_count', 'childrens_ranked_books_count', 'total_ranked_books_count']

class UserBookSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserBook
        fields = ['work_id', 'title', 'author', 'image_url', 'description', 'rating', 'normalized_rating', 'date_added', 'is_ranked', 'genre', 'book_type']
        # fields = ['id', 'work_id', 'title', 'author', 'image_url','description', 'rating', 'elo_rating', 'RD', 'normalized_rating', 'date_added', 'is_ranked']

class TBRBookSerializer(serializers.ModelSerializer):
    class Meta:
        model = TBRBook
        fields = ['work_id', 'title', 'author', 'image_url', 'date_added']

class UserRecommendationSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserRecommendation
        fields = ['work_id', 'title', 'author', 'description', 'image_url', 'viewed', 'score']

class BookSerializer(serializers.ModelSerializer):
    class Meta:
        model = Book
        fields = ['work_id', 'title', 'author', 'description', 'image_url', 'book_type', 'genre', 'ratings_count', 'average_rating']

class BookSearchResultSerializer(serializers.Serializer):
    book = BookSerializer()
    in_library = serializers.BooleanField()
    in_tbr = serializers.BooleanField()

## API SERIALIZERS
class BookIdentifierSerializer(serializers.Serializer):
    """For multiple endpoints requiring work_id."""
    work_id = serializers.CharField(required=True)

class BookRatingSerializer(BookIdentifierSerializer):
    """For multiple endpoints requiring work_id and rating."""
    RATING_CHOICES = (
        ('high', 'high'),
        ('medium', 'medium'),
        ('low', 'low'),
    )
    rating = serializers.ChoiceField(choices=RATING_CHOICES, required=True)

class SearchQuerySerializer(serializers.Serializer):
    """For GET /api/search/"""
    query = serializers.CharField(required=True, min_length=1)

class UserBookCreateSerializer(BookRatingSerializer):
    """For POST /api/userbooks/"""
    pass
    ## having these fields was causing errors since it only gets passed w work_id and rating
    # title = serializers.CharField(required=True)
    # author = serializers.CharField(required=True)
    # image_url = serializers.URLField(required=False, allow_blank=True)
    # description = serializers.CharField(required=False, allow_blank=True)

class UserBookUpdateSerializer(serializers.Serializer):
    """For PATCH /api/userbooks/"""
    # doesn't inherit from BookRatingSerializer bc viewset, so work_id is passed in the URL
    rating = serializers.ChoiceField(choices=['high', 'medium', 'low'])

class CompareBookRequestSerializer(BookIdentifierSerializer):
    """For GET /api/compare-book/"""
    pass

class CompareBookUpdateSerializer(serializers.Serializer):
    """For POST /api/compare-book/"""
    new_book_id = serializers.CharField(required=True)
    existing_book_id = serializers.CharField(required=True)
    outcome = serializers.FloatField(required=True, min_value=-1, max_value=1)

class RecommendationViewSerializer(BookIdentifierSerializer):
    """For PATCH /api/recommendations/"""
    pass

class RecommendationCreateSerializer(BookIdentifierSerializer):
    """For POST /api/recommendations/"""
    pass

class TBRBookCreateSerializer(BookIdentifierSerializer):
    """For POST /api/to-be-read/"""
    title = serializers.CharField(required=True)
    author = serializers.CharField(required=True)
    image_url = serializers.URLField(required=False, allow_blank=True)

class TBRBookDeleteSerializer(BookIdentifierSerializer):
    """For DELETE /api/to-be-read/"""
    pass