from django.db import models
from django.contrib.auth.models import AbstractUser
from django.db.models import F
from django.db.models.functions import Abs
from .services import PineconeService
import math

# Constants used in Glicko rating system
q = 0.01

def g(RD):
    return 1 / math.sqrt(1 + 3 * q**2 * RD**2 / math.pi**2)

def E(rating, opponent_rating, opponent_RD):
    return 1 / (1 + math.exp(-g(opponent_RD) * (rating - opponent_rating) / 400))

class UserAccount(AbstractUser):
    pass


class UserBookManager(models.Manager):
    def get_user_books(self, user):
        books = self.filter(user=user)
        ranked_books = list(books.filter(is_ranked=True))
        unranked_books = list(books.filter(is_ranked=False))
        sorted_ranked_books = sorted(ranked_books, key=lambda x: (x.normalized_rating if x.normalized_rating is not None else 0), reverse=True)
        sorted_unranked_books = sorted(unranked_books, key=lambda x: (x.date_added), reverse=True)
        return sorted_ranked_books + sorted_unranked_books

    def add_or_update_book(self, user, work_id, rating, pinecone_book):
        return self.update_or_create(
            user=user,
            work_id=work_id,
            defaults={
                'title': pinecone_book['title'], 
                'author': pinecone_book['author_name'], 
                'description': pinecone_book['description'],
                'image_url': pinecone_book['image_url'],
                'rating': rating
            }
        )

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

    def get_comparison_book(self, user, work_id, excluded_work_ids=None):
        """
        Gets a book to compare with the given book, excluding certain work IDs.
        Returns (book, status_message) tuple where status_message is None for success
        or a message indicating why no book was found.
        """
        if excluded_work_ids is None:
            excluded_work_ids = []

        book_obj = self.get(work_id=work_id, user=user)
        
        queryset_results = (
            self.exclude(work_id=work_id)
            .exclude(work_id__in=excluded_work_ids)
            .filter(user=user, rating=book_obj.rating)
            .annotate(rating_diff=Abs(F('elo_rating') - book_obj.elo_rating))
            .order_by('rating_diff')
        )

        if queryset_results.count() == 0:
            book_obj.is_ranked = True
            book_obj.save()
            return None, 'No more books to compare'
        
        if len(excluded_work_ids) >= 3:
            book_obj.is_ranked = True
            book_obj.save()
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
        """
        book_obj = self.get(work_id=work_id, user=user)
        other_book_obj = self.get(work_id=other_work_id, user=user)
        
        new_rating, new_RD = self.calc_new_rating(book_obj, other_book_obj, outcome)
        other_new_rating, other_new_RD = self.calc_new_rating(other_book_obj, book_obj, 1 - outcome)

        book_obj.elo_rating = new_rating
        book_obj.RD = new_RD
        book_obj.save()

        other_book_obj.elo_rating = other_new_rating
        other_book_obj.RD = other_new_RD
        other_book_obj.save()



class UserBook(models.Model):
    objects = UserBookManager()
    
    user = models.ForeignKey(UserAccount, on_delete=models.CASCADE)
    work_id = models.CharField(max_length=50)
    title = models.CharField(max_length=200)
    author = models.CharField(max_length=100)
    description = models.TextField()
    image_url = models.URLField()
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
        if self.rating == "high":
            return round(6.66 + (self.elo_rating - 1000) * (10 - 6.66) / 1000, 2)
        elif self.rating == "medium":
            return round(3.33 + (self.elo_rating - 1000) * (6.66 - 3.33) / 1000, 2)
        elif self.rating == "low":
            return round((self.elo_rating - 1000) * 3.33 / 1000, 2)

    class Meta:
        unique_together = ('user', 'work_id')


class TBRBook(models.Model):
    user = models.ForeignKey(UserAccount, on_delete=models.CASCADE)
    work_id = models.CharField(max_length=50)
    title = models.CharField(max_length=200)
    author = models.CharField(max_length=100)
    image_url = models.URLField()
    date_added = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'work_id')



class UserRecommendationManager(models.Manager):
    def __init__(self):
        super().__init__()
        self.pinecone_service = PineconeService()

    def get_books_from_pinecone(self, work_id, k=10):
        """
        Given a seed book, fetches the top k recommendations from the Pinecone index.
        """
        seed_vector = self.pinecone_service.fetch_vector(work_id)
        return self.pinecone_service.query_similar(
            vector=seed_vector['values'],
            k=k
        )

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
        seed_vector = self.pinecone_service.fetch_vector(work_id)
        seed_author = seed_vector['metadata']['author_name']
        
        recommendations = self.get_books_from_pinecone(work_id)
        
        added_recs = 0
        for book in recommendations:
            if (
                not UserBook.objects.filter(work_id=book['id'], user=user).exists()
                and book['metadata']['author_name'] != seed_author
            ):
                self.update_or_create(
                    user=user,
                    work_id=book['id'],
                    defaults={
                        'title': book['metadata']['title'],
                        'author': book['metadata']['author_name'],
                        'score': book['score'],
                        'description': book['metadata']['description'],
                        'image_url': book['metadata']['image_url'],
                        'reference_work_id': work_id
                    }
                )
                added_recs += 1

            if added_recs >= max_recommendations:
                break

        return added_recs


class UserRecommendation(models.Model):
    objects = UserRecommendationManager()
    
    user = models.ForeignKey(UserAccount, on_delete=models.CASCADE)
    work_id = models.CharField(max_length=50)
    title = models.CharField(max_length=200)
    author = models.CharField(max_length=100)
    description = models.TextField()
    image_url = models.URLField()
    viewed = models.BooleanField(default=False)
    reference_work_id = models.CharField(max_length=50)
    score = models.FloatField(default=0)
    outcome = models.BooleanField(null=True)

    class Meta:
        unique_together = ('user', 'work_id')
