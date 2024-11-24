from django.db import models
from django.contrib.auth.models import AbstractUser

class UserAccount(AbstractUser):
    pass

class UserBookRating(models.Model):
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


class UserToBeRead(models.Model):
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
