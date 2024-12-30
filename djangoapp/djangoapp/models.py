from django.db import models
from django.contrib.auth.models import AbstractUser
from django.db.models import F, Q, ExpressionWrapper, BooleanField
from django.db.models.functions import Abs
from .services import PineconeService, OpenSearchService
import math
from django.core.validators import MinValueValidator, MaxValueValidator
from django.core.exceptions import ObjectDoesNotExist


pinecone_service = PineconeService()
open_search_service = OpenSearchService()

# Constants used in Glicko rating system
q = 0.01
def g(RD):
    return 1 / math.sqrt(1 + 3 * q**2 * RD**2 / math.pi**2)

def E(rating, opponent_rating, opponent_RD):
    return 1 / (1 + math.exp(-g(opponent_RD) * (rating - opponent_rating) / 400))



class UserAccount(AbstractUser):
    nonfiction_ranked_books_count = models.PositiveIntegerField(default=0)
    fiction_ranked_books_count = models.PositiveIntegerField(default=0)
    childrens_ranked_books_count = models.PositiveIntegerField(default=0)
    total_ranked_books_count = models.PositiveIntegerField(default=0)

    def increment_book_count(self, book_type):
        if book_type == 'non-fiction':
            self.nonfiction_ranked_books_count += 1
        elif book_type == 'fiction':
            self.fiction_ranked_books_count += 1
        elif book_type == 'children':
            self.childrens_ranked_books_count += 1

        self.total_ranked_books_count += 1
        self.save()


class AbstractBook(models.Model):
    work_id = models.CharField(max_length=50)
    title = models.CharField(max_length=200)
    author = models.CharField(max_length=100)
    description = models.TextField()
    image_url = models.URLField()
    book_type = models.CharField(max_length=50)
    genre = models.CharField(max_length=100)
    ratings_count = models.PositiveIntegerField(default=0)
    average_rating = models.FloatField(
        validators=[MinValueValidator(0), MaxValueValidator(5)],
        null=True,
        blank=True
    )

    def __str__(self):
        return f"{self.title} by {self.author}"

    class Meta:
        abstract = True


class BookManager(models.Manager):
    def search_books(self, query):
        search_results = open_search_service.search(query)
        
        # Get all books in a single query
        work_ids = [result['work_id'] for result in search_results]
        if not work_ids:
            return []
            
        # Get books and maintain search result ordering
        books = self.filter(work_id__in=work_ids)
        books_dict = {book.work_id: book for book in books}
        sorted_books = [books_dict[work_id] for work_id in work_ids if work_id in books_dict]
        
        return sorted_books


class Book(AbstractBook):
    objects = BookManager()

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['work_id'],
                name='unique_work_id'
            )
        ]


class UserBookManager(models.Manager):
    def get_user_books(self, user):
        books = self.filter(user=user)
        ranked_books = list(books.filter(is_ranked=True))
        unranked_books = list(books.filter(is_ranked=False))
        sorted_ranked_books = sorted(ranked_books, key=lambda x: (x.normalized_rating if x.normalized_rating is not None else 0), reverse=True)
        sorted_unranked_books = sorted(unranked_books, key=lambda x: (x.date_added), reverse=True)
        return sorted_ranked_books + sorted_unranked_books

    def add_or_update_book(self, user, work_id, rating):
        try:
            book = Book.objects.get(work_id=work_id)
            return self.create(
                user=user,
                work_id=book.work_id,
                title=book.title,
                author=book.author,
                description=book.description,
                image_url=book.image_url,
                book_type=book.book_type,
                genre=book.genre,
                ratings_count=book.ratings_count,
                average_rating=book.average_rating,
                rating=rating
            )
        except Book.DoesNotExist:
            raise ObjectDoesNotExist(f"No Book found with work_id: {work_id}")

    def update_book_rating(self, user, work_id, rating):
        book = self.get(user=user, work_id=work_id)
        book.rating = rating
        book.elo_rating = 1500
        book.RD = 400
        book.save()
        return book

    def delete_book(self, user, work_id):
        book = self.get(user=user, work_id=work_id)
        book.delete()

    def get_comparison_book(self, user, work_id, excluded_work_ids=None, valid_comparison_count=0):
        """
        Gets a book to compare with the given book, excluding certain work IDs.
        Returns (book, status_message) tuple where status_message is None for success
        or a message indicating why no book was found.
        """
        if excluded_work_ids is None:
            excluded_work_ids = []

        book_obj = self.get(work_id=work_id, user=user)
        
        queryset_results = (
            self
            .exclude(work_id=work_id)
            .exclude(work_id__in=excluded_work_ids)
            .filter(user=user, rating=book_obj.rating, is_ranked=True, book_type=book_obj.book_type)
            .annotate(
                rating_diff=Abs(F('elo_rating') - book_obj.elo_rating),
                same_genre=Q(genre=book_obj.genre)
            )
            .order_by('-same_genre', 'rating_diff')
        )

        if queryset_results.count() == 0:
            book_obj.is_ranked = True
            book_obj.save()
            
            user.increment_book_count(book_obj.book_type.lower())
            return None, 'No more books to compare'
        
        if valid_comparison_count >= 3:
            book_obj.is_ranked = True
            book_obj.save()
            
            user.increment_book_count(book_obj.book_type.lower())
            return None, 'Book ranking complete'
        
        return queryset_results.first(), None

    def calc_new_rating(self, book_obj, other_book_obj, outcome):
        """
        Calculates the new elo rating and RD for a single book after a comparison.
        """
        book_obj_rating = book_obj.elo_rating
        other_book_obj_rating = other_book_obj.elo_rating
        book_obj_RD = book_obj.RD
        other_book_obj_RD = other_book_obj.RD

        g_RD = g(other_book_obj_RD)
        E_score = E(book_obj_rating, other_book_obj_rating, other_book_obj_RD)
        d2 = (q**2 * g_RD**2 * E_score * (1 - E_score))**-1
        new_rating = book_obj_rating + (q / (1 / book_obj_RD**2 + 1 / d2)) * g_RD * (outcome - E_score)
        new_RD = math.sqrt((1 / book_obj_RD**2 + 1 / d2)**-1)

        return new_rating, new_RD

    def update_ratings(self, user, work_id, other_work_id, outcome):
        """
        Updates the elo ratings and RDs of two books after a comparison.
        Skip rating updates if outcome is -1 (not comparable)
        """
        book_obj = self.get(work_id=work_id, user=user)
        other_book_obj = self.get(work_id=other_work_id, user=user)
        
        # Only update ratings if the outcome is a valid comparison
        if outcome != -1:
            new_rating, new_RD = self.calc_new_rating(book_obj, other_book_obj, outcome)
            other_new_rating, other_new_RD = self.calc_new_rating(other_book_obj, book_obj, 1 - outcome)

            book_obj.elo_rating = new_rating
            book_obj.RD = new_RD
            book_obj.save()

            other_book_obj.elo_rating = other_new_rating
            other_book_obj.RD = other_new_RD
            other_book_obj.save()

    def get_unranked_books(self, user):
        """
        Fetches the highest-scoring unranked books for the user.
        """
        return self.filter(user=user, is_ranked=False).order_by('-date_added')



class UserBook(AbstractBook):
    objects = UserBookManager()
    
    user = models.ForeignKey(UserAccount, on_delete=models.CASCADE)
    rating = models.CharField(max_length=10, choices=[
        ('high', 'High'),
        ('medium', 'Medium'),
        ('low', 'Low'),
    ], null=True)
    elo_rating = models.FloatField(default=1500)
    RD = models.FloatField(default=400)
    date_added = models.DateTimeField(auto_now_add=True)
    is_ranked = models.BooleanField(default=False)

    @property
    def normalized_rating(self):
        if self.is_ranked == False:
            return None
        elif self.user.total_ranked_books_count < 15:
            return '—'
        elif self.rating == "high":
            return round(6.66 + (self.elo_rating - 1000) * (10 - 6.66) / 1000, 2)
        elif self.rating == "medium":
            return round(3.33 + (self.elo_rating - 1000) * (6.66 - 3.33) / 1000, 2)
        elif self.rating == "low":
            return round((self.elo_rating - 1000) * 3.33 / 1000, 2)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['user', 'work_id'],
                name='unique_user_book'
            )
        ]


class TBRBook(AbstractBook):
    user = models.ForeignKey(UserAccount, on_delete=models.CASCADE)
    date_added = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['user', 'work_id'],
                name='unique_user_tbr_book'
            )
        ]



class UserRecommendationManager(models.Manager):

    def get_unviewed_recommendation(self, user):
        """
        Fetches the highest-scoring unviewed recommendation for the user.
        """
        return self.filter(user=user, viewed=False).order_by('-score').first()

    def mark_recommendation_as_viewed(self, user, work_id):
        """
        Marks a recommendation as viewed for the user.
        """
        self.filter(user=user, work_id=work_id).update(viewed=True)

    def add_recommendations_from_seed(self, user, work_id, max_recommendations=3):
        """
        Given a seed book, fetches recommendations and adds them to the database.
        Returns number of recommendations added.
        """
        seed_book = Book.objects.get(work_id=work_id)
        recommendations = pinecone_service.get_books_from_pinecone(work_id)
        
        added_recs = 0
        for pinecone_book in recommendations:
            if (
                not UserBook.objects.filter(work_id=pinecone_book['id'], user=user).exists()
                and pinecone_book['metadata']['author_name'] != seed_book.author
            ):
                try:
                    book = Book.objects.get(work_id=pinecone_book['id'])
                    
                    self.update_or_create(
                        work_id=book.work_id,
                        user=user,
                        defaults={
                            'title': book.title,
                            'author': book.author,
                            'description': book.description,
                            'image_url': book.image_url,
                            'book_type': book.book_type,
                            'genre': book.genre,
                            'ratings_count': book.ratings_count,
                            'average_rating': book.average_rating,
                            'score': pinecone_book['score'],
                            'reference_book': seed_book
                        }
                    )
                    added_recs += 1

                    if added_recs >= max_recommendations:
                        break
                        
                except Book.DoesNotExist:
                    continue

        return added_recs



class UserRecommendation(AbstractBook):
    objects = UserRecommendationManager()
    
    user = models.ForeignKey(UserAccount, on_delete=models.CASCADE)
    viewed = models.BooleanField(default=False)
    reference_book = models.ForeignKey(Book, on_delete=models.CASCADE, related_name='recommendations')
    score = models.FloatField(default=0)
    outcome = models.BooleanField(null=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['user', 'work_id'],
                name='unique_user_recommendation'
            )
        ]
