# serializers.py
from rest_framework import serializers
from .models import UserAccount, UserBook, UserRecommendation, Book


## MODEL SERIALIZERS
class UserAccountSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserAccount
        fields = ['id', 'username', 'nonfiction_ranked_books_count', 'fiction_ranked_books_count', 'childrens_ranked_books_count', 'total_ranked_books_count']

class UserBookSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserBook
        fields = [
            'work_id', 'title', 'author', 'image_url', 'description', 
            'bucket', 'normalized_rating', 'date_added', 'is_ranked', 
            'genre', 'book_type', 'status', 'date_finished',
        ]

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

class BookBucketSerializer(BookIdentifierSerializer):
    """For multiple endpoints requiring work_id and bucket."""
    BUCKET_CHOICES = (
        ('high', 'high'),
        ('medium', 'medium'),
        ('low', 'low'),
    )
    bucket = serializers.ChoiceField(choices=BUCKET_CHOICES, required=True)

class SearchQuerySerializer(serializers.Serializer):
    """For GET /api/search/"""
    query = serializers.CharField(required=True, min_length=1)

class UserBookListSerializer(serializers.Serializer):
    """For GET /api/userbooks/"""
    status = serializers.ChoiceField(choices=UserBook.BookStatus.choices, required=False)

class UserBookCreateSerializer(serializers.Serializer):
    """For POST /api/userbooks/"""
    work_id = serializers.CharField(required=True)
    title = serializers.CharField(required=True)
    author = serializers.CharField(required=True)
    status = serializers.ChoiceField(choices=UserBook.BookStatus.choices, required=True)
    bucket = serializers.ChoiceField(choices=UserBook.BookBucket.choices, required=False)

class UserBookUpdateSerializer(serializers.Serializer):
    """For PATCH /api/userbooks/{id}/"""
    status = serializers.ChoiceField(choices=UserBook.BookStatus.choices, required=True)
    bucket = serializers.ChoiceField(choices=UserBook.BookBucket.choices, required=False)

    def validate(self, data):
        """
        Check that bucket is provided if status is READ
        """
        if data['status'] == UserBook.BookStatus.READ and 'bucket' not in data:
            raise serializers.ValidationError("Bucket is required when status is 'read'")
        return data

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