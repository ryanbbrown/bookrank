# views.py
# Python standard library imports
import json
import math
import os

# Third party imports
import pandas as pd
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

# Django imports
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.hashers import make_password
from django.contrib.auth.models import AnonymousUser
from django.contrib.auth.views import LoginView, LogoutView
from django.core.files.storage import default_storage
from django.db.models import Expression, F
from django.db.models.fields import FloatField
from django.db.models.functions import Abs
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import ensure_csrf_cookie

# Local imports
from .models import UserAccount, UserBook, TBRBook, UserRecommendation
from .serializers import (
    UserAccountSerializer,
    UserBookSerializer,
    TBRBookSerializer,
    UserRecommendationSerializer
)


print('partway through imports')

from opensearchpy import OpenSearch, RequestsHttpConnection
from dotenv import load_dotenv
load_dotenv()
from django.views.generic import TemplateView
from pathlib import Path
import logging

import pandas as pd
from pinecone import Pinecone


# from groq import Groq
# from langchain_huggingface import HuggingFaceEmbeddings
# GROQ_API_KEY = os.getenv('GROQ_API_KEY')
# groq_client = Groq(api_key=GROQ_API_KEY)
# EMBEDDING_MODEL = 'thenlper/gte-small'
# SUMMARY_PROMPT = """
# You are a chatbot designed to give one-sentences responses that connect a user query
# and a book description. You should only ever reply with one sentence.

# You will be given a user query a single book's title and description. Your goal is to generate one sentence
# explaining how the book is relevant to the user query.

# Below are some examples of expected output:


# USER INPUT: Any fantasy with magical trials?
# OUTPUT 1: 'The Iron Trial' is a perfect pick for you, as it centers around magical trials that determine the fate of young wizards.
# OUTPUT 2: Furyborn is a perfect match for your search, featuring Rielle who must endure seven elemental magic trials to prove herself as the prophesied Sun Queen.
# OUTPUT 3: The Wonderland Trials is a perfect pick for you, featuring magical trials in a fantastical Wonderland setting where players must solve clues and survive dangerous challenges.
# OUTPUT 4: Sufficiently Advanced Magic is a perfect fit for your search, featuring a protagonist who must survive magical trails in a colossal tower to gain powers and find his lost brother.
# OUTPUT 5: The Princess Trials is a thrilling fantasy book featuring magical trials where contestants compete for a prince's hand in a deadly, televised pageant.
# OUTPUT 6: 'An Unkindness of Magicians' is a thrilling fantasy set in New York City, featuring magical trials and a powerful magician named Sydney who aims to disrupt the magical system.

# USER INPUT: What books have thrilling heists?
# OUTPUT 1: The palace job is a thrilling high-fantasy heist caper with a team of magical misfits on a dating mission to steal a priceless elven manuscript.
# OUTPUT 2: 'Heist Society' is a thrilling adventure filled with high-stakes heists, perfect for anyone looking for a book about daring thefts and clever cons
# OUTPUT 3: An Illusion of Thieves is a perfect pick for thrilling heists, featuring a ragtag crew using forbidden magic to pull off an elaborate heist and stop a civil war.
# OUTPUT 4: 'Thick as thieves' is a perfect pick for you, as it dives deep into the thrilling aftermath of a heist gone wrong, with secrets unraveling and suspense at every turn
# OUTPUT 5: California Bones is a thrilling heist adventure where ap petty thief and his team must break into a storehouse of magical artifacts in a fantastical version of Los Angeles
# OUTPUT 6: 'The monsters We Defy' is a thrilling heist novel set in 1925 Washington D.C., blending magic, history, and a daring mission to steal a magical ring.


# Below is the actual user query and book description you will be working with:
# USER QUERY: {user_query}
# BOOK TITLE: {book_title}
# BOOK DESCRIPTION: {book_description}

# """
# import shutil
# shutil.rmtree('/home/ryanbrown/.cache/huggingface/hub/models--thenlper--gte-small', ignore_errors=True)
# from sentence_transformers import SentenceTransformer
# embedding_model = SentenceTransformer(EMBEDDING_MODEL)


HOST = 'https://search-bookrank-testing-6jgeuos7njdnqf5yzhbutmoea4.us-east-2.es.amazonaws.com'  # Replace with your domain endpoint

MASTER_USER = os.getenv('MASTER_USER')
MASTER_PASSWORD = os.getenv('MASTER_PASSWORD')
INDEX_NAME = 'goodreads_books'
PINECONE_API_KEY = os.getenv('PINECONE_API_KEY')
PINECONE_INDEX_NAME = 'goodreads-top-50k'


client = OpenSearch(
    hosts=[HOST],
    http_auth=(MASTER_USER, MASTER_PASSWORD),
    use_ssl=True,
    verify_certs=True,
    connection_class=RequestsHttpConnection
)

pc = Pinecone(api_key=PINECONE_API_KEY)
index = pc.Index(PINECONE_INDEX_NAME)



# some global variables referenced in here oh well
# could maybe define this inside searchView later but chilling for now
def search(query):
    search_query = {
    "query": {
        "function_score": {
        "query": {
            "multi_match": {
            "query": query,
            "fields": ["title", "author_name", "genres"],
            "fuzziness": "AUTO"
            }
        },
        "functions": [
            {
            "field_value_factor": {
                "field": "log_ratings",
                "factor": 1
            }
            }
        ],
        "boost_mode": "sum"
        }
    }
    }

    response = client.search(index=INDEX_NAME, body=search_query)
    
    try:
        hitlist = response['hits']['hits']
        rowlist = [dict({'score': hit['_score']}, **hit['_source']) for hit in hitlist]
        df = pd.DataFrame(rowlist).rename(columns={'author_name': 'author'})

        return df[['work_id', 'title', 'author', 'image_url', 'description']].to_dict(orient='records')
        # return [(book, author) for book, author in zip(df['title'], df['author_name'])]
    except Exception as e:
        raise e

q = 0.01  # Constant used in Glicko rating system
def g(RD):
    return 1 / math.sqrt(1 + 3 * q**2 * RD**2 / math.pi**2)

def E(rating, opponent_rating, opponent_RD):
    return 1 / (1 + math.exp(-g(opponent_RD) * (rating - opponent_rating) / 400))



logger = logging.getLogger('django.info')

class LoginView(APIView):
    """
    This view logs in a user and creates a new session.
    """
    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        user = authenticate(request, username=username, password=password)
        
        if user is not None:
            request.session.flush()
            login(request, user)
            token, created = Token.objects.get_or_create(user=user)
            
            return Response({
                'success': True,
                'data': {'token': token.key},
                'message': 'Successfully logged in'
            })
        else:
            return Response({
                'success': False,
                'error': 'Invalid credentials',
                'message': 'Login failed'
            }, status=status.HTTP_401_UNAUTHORIZED)


class SignupView(APIView):
    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        password_confirm = request.data.get('password_confirm')

        if password != password_confirm:
            return Response({
                'success': False,
                'error': 'Passwords do not match',
                'message': 'Signup failed'
            }, status=status.HTTP_400_BAD_REQUEST)

        if UserAccount.objects.filter(username=username).exists():
            return Response({
                'success': False,
                'error': 'Username already taken',
                'message': 'Signup failed'
            }, status=status.HTTP_400_BAD_REQUEST)

        user = UserAccount.objects.create_user(username=username, password=password)
        user.save()

        request.session.flush()
        login(request, user)

        auth_user_id = request.session.get('_auth_user_id')
        token, created = Token.objects.get_or_create(user=user)
        
        return Response({
            'success': True,
            'data': {'token': token.key},
            'message': 'Successfully signed up'
        }, status=status.HTTP_201_CREATED)


class LogoutView(APIView):
    def post(self, request):
        logout(request)
        request.session.flush()
        request.user = AnonymousUser()
        logger.info(f'Session post-logout {request.session.items()}')
        # TODO: needs more standardization
        response = Response({
            'success': True,
            'message': 'Successfully logged out'
        })
        response['Cache-Control'] = 'no-cache, no-store, must-revalidate'
        response['Pragma'] = 'no-cache'
        response['Expires'] = '0'
        return response



class SearchView(APIView):
    """
    This view searches for books in the AWS OpenSearch client based on a query string.
    """
    def get(self, request):
        query = request.query_params.get('query')
        searchbooklist = search(query)

        return Response({
            'success': True,
            'data': searchbooklist,
            'message': 'Search results retrieved successfully'
        })



class UserBooksView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """
        Gets all of user's finished books and sorts them by rating to display on the frontend.
        """
        if not request.user.is_authenticated:
            return Response({
                'success': False,
                'error': 'Authentication required',
                'message': 'Please log in'
            }, status=status.HTTP_401_UNAUTHORIZED)
            
        user = request.user
        sorted_books = UserBook.objects.get_user_books(user)
        serializer = UserBookSerializer(sorted_books, many=True)
        
        return Response({
            'success': True,
            'data': serializer.data,
            'message': 'User books retrieved successfully'
        })

    def post(self, request):
        """
        Adds a UserBook object to the database, associated with the current user.
        It is the only way that users can add finished books to their account.
        """
        work_id = request.data.get('work_id')
        rating = request.data.get('rating')
        user = request.user
        
        # TODO: update_or_create here allows them to re-add existing book with new rating
        # not sure what it does to elo rating field
        pinecone_book = index.fetch(ids=[work_id])['vectors'][work_id]['metadata']
        UserBook.objects.add_or_update_book(user, work_id, rating, pinecone_book)
        
        return Response({
            'success': True,
            'message': 'Book added to account'
        })

    def patch(self, request):
        """
        Updates the rating of a UserBook object.
        """
        work_id = request.data.get('work_id')
        rating = request.data.get('rating')
        user = request.user

        UserBook.objects.update_book_rating(user, work_id, rating)

        return Response({
            'success': True,
            'message': 'Rating updated successfully'
        })

    def delete(self, request):
        """
        Deletes a book from a user's finished books list.
        """
        work_id = request.query_params.get('work_id')
        UserBook.objects.delete_book(request.user, work_id)

        return Response({
            'success': True,
            'message': 'Book removed from finished books list'
        })



class CompareBookView(APIView):
    """
    This view contains the logic for fetching comparison books and updating the elo ratings post-comparison.
    """
    def get(self, request):
        """
        Gets the book to compare with the current book.
        """
        work_id = request.query_params.get('work_id')
        user = request.user

        # Initialize session data if needed
        if work_id not in request.session:
            request.session[work_id] = {'compared_books': []}
            request.session.save()

        # Get comparison book using manager method
        comparison_book, status_message = UserBook.objects.get_comparison_book(
            user=user,
            work_id=work_id,
            excluded_work_ids=request.session[work_id]['compared_books']
        )

        if status_message:
            return Response({
                'success': True,
                'data': None,
                'message': status_message
            })
        
        serializer = UserBookSerializer(comparison_book)
        return Response({
            'success': True,
            'data': serializer.data,
            'message': 'Comparison book retrieved successfully'
        })

    def post(self, request):
        """
        Updates the ratings of two books after a comparison.
        """
        work_id = request.data.get('new_book_id')
        other_work_id = request.data.get('existing_book_id')
        outcome = request.data.get('outcome')
        user = request.user
        
        if not request.session.session_key:
            request.session.save()
        
        # add the compared book to the session memory
        request.session[work_id]['compared_books'].append(other_work_id)
        request.session.save()

        # Use manager method to update ratings
        UserBook.objects.update_ratings(
            user=user,
            work_id=work_id,
            other_work_id=other_work_id,
            outcome=outcome
        )

        return Response({
            'success': True,
            'message': 'Rating updated successfully'
        })



class RecommendationView(APIView):
    """
    This view fetches recommendations for the current user and updates them as viewed post-interaction.
    """
    def get(self, request):
        """
        Fetches the highest-scoring unviewed recommendation for the current user.
        """
        user = request.user
        recommendation = UserRecommendation.objects.get_unviewed_recommendation(user)
        
        if recommendation:
            serializer = UserRecommendationSerializer(recommendation)
            return Response({
                'success': True,
                'data': serializer.data,
                'message': 'Recommendation retrieved successfully'
            })
        else:
            return Response({
                'success': True,
                'data': None,
                'message': 'No recommendations available'
            })

    def patch(self, request):
        """
        Updates a recommendation as viewed so that it won't be shown again.
        """
        UserRecommendation.objects.mark_recommendation_as_viewed(
            user=request.user,
            work_id=request.data.get('work_id')
        )

        return Response({
            'success': True,
            'message': 'Recommendation marked as viewed'
        })

    def post(self, request):
        """
        Given a seed book, adds recommendations to the database.
        This function currently runs every time the user adds a "high" bucketed book to their account.
        """
        work_id = request.data.get('work_id')
        
        added_count = UserRecommendation.objects.add_recommendations_from_seed(
            user=request.user,
            work_id=work_id
        )

        return Response({
            'success': True,
            'message': f'Added {added_count} recommendations successfully'
        })



# TODO: simple enough that no manager needed, ViewSet should help though
class ToBeReadView(APIView):
    """
    This view contains the logic for managing and viewing a user's TBR list.
    TODO: add delete functionality to remove books from list
    """
    def get(self, request):
        """
        Gets all of user's TBR books to display on the frontend.
        """
        user = request.user
        books = (
            TBRBook
            .objects
            .filter(user=user)
        )
        serializer = TBRBookSerializer(books, many=True)
        return Response({
            'success': True,
            'data': serializer.data,
            'message': 'TBR list retrieved successfully'
        })
    

    def post(self, request):
        """
        Adds a book to a user's TBR list.
        """
        work_id = request.data.get('work_id')
        title = request.data.get('title')
        author = request.data.get('author')
        image_url = request.data.get('image_url')
        user = request.user
        
        if not all([work_id, title, author]):
            return Response({
                'success': False,
                'error': 'All fields are required',
                'message': 'Failed to add book to TBR list'
            }, status=400)
        
        var = TBRBook.objects.create(
            user=user,
            work_id=work_id,
            title=title,
            author=author,
            image_url=image_url,
        )
        
        return Response({
            'success': True,
            'message': 'Book added to TBR list'
        })

    def delete(self, request):
        """
        Deletes a book from a user's TBR list.
        """
        tbr_book = TBRBook.objects.get(
            user=request.user,
            work_id=request.query_params.get('work_id')
        )

        tbr_book.delete()
        return Response({
            'success': True,
            'message': 'Book removed from TBR list'
        })




class UnrankedBooksView(APIView):
    """
    This view fetches unranked books for the current user to rank.
    """
    def get(self, request):
        """
        Fetches the highest-scoring unranked book for the current user.
        """
        user = request.user
        unranked_books = (
            UserBook
            .objects
            .filter(user=user, is_ranked=False)
            .order_by('-date_added')
        )
        if unranked_books.exists():
            serializer = UserBookSerializer(unranked_books.first())
            return Response({
                'success': True,
                'data': serializer.data,
                'message': 'Unranked book retrieved successfully'
            })
        else:
            return Response({
                'success': True,
                'data': None,
                'message': 'No unranked books available'
            })




from djangoapp.tasks import process_csv
class GoodreadsImportView(APIView):
    """
    This view contains the logic for importing books from Goodreads to the user account.
    """
    def post(self, request):
        file = request.FILES.get('file')
        
        if file is None or not file.name.endswith('.csv'):
            return Response({
                'success': False,
                'error': 'Only CSV files are allowed',
                'message': 'File upload failed'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Save the uploaded file to a temporary location
            file_path = default_storage.save(file.name, file)
            file_full_path = default_storage.path(file_path)
            
            # Read the CSV file into a pandas DataFrame
            df = pd.read_csv(file_full_path)
            print(request.user.id)
            print(df.head())
            process_csv.delay(file_full_path, request.user.id)
            
            
            # Perform further processing here (if needed)
            
            return Response({
                'success': True,
                'message': 'File uploaded and processing started'
            }, status=status.HTTP_201_CREATED)
        except Exception as e:
            print(e)
            return Response({
                'success': False,
                'error': str(e),
                'message': 'File processing failed'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


BASE_DIR = Path(__file__).resolve().parent.parent
REACT_APP_DIR = os.path.join(BASE_DIR, '../../my-app/build')
class ReactAppView(TemplateView):
    template_name = os.path.join(REACT_APP_DIR, 'index.html')