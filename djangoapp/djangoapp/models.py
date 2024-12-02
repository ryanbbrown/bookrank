from django.db import models
from django.contrib.auth.models import AbstractUser

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

class UserBook(models.Model):
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


class UserRecommendation(models.Model):
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
