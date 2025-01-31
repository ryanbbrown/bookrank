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
from rest_framework.exceptions import ValidationError
from rest_framework.generics import RetrieveAPIView
from rest_framework import viewsets
from rest_framework.decorators import action

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
from .models import UserAccount, UserBook, UserRecommendation, Book
from .serializers import (
    UserAccountSerializer,
    UserBookSerializer,
    UserRecommendationSerializer,
    SearchQuerySerializer,
    UserBookCreateSerializer,
    UserBookUpdateSerializer,
    CompareBookRequestSerializer,
    CompareBookUpdateSerializer,
    RecommendationViewSerializer,
    RecommendationCreateSerializer,
    BookSerializer,
    BookSearchResultSerializer,
    UserBookListSerializer,
)
from .services import OpenSearchService


from opensearchpy import OpenSearch, RequestsHttpConnection
from dotenv import load_dotenv
load_dotenv()
from django.views.generic import TemplateView
from pathlib import Path
import logging

import pandas as pd
from pinecone import Pinecone








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
        serializer = SearchQuerySerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)
        
        query = serializer.validated_data['query']
        sorted_books = Book.objects.search_books(request.user, query)
        serializer = BookSearchResultSerializer(sorted_books, many=True)

        return Response({
            'success': True,
            'data': serializer.data,
            'message': 'Search results retrieved successfully'
        })


# test
class UserBooksViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    def list(self, request):
        """
        Gets user's books filtered by status if specified.
        """
        serializer = UserBookListSerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)
        
        user = request.user
        status = serializer.validated_data.get('status')
        
        queryset = UserBook.objects.filter(user=user)
        if status:
            queryset = queryset.filter(status=status)
            
        if status == UserBook.BookStatus.READ:
            # For read books, sort by rating
            books = UserBook.objects.get_user_books(user)
        elif status == UserBook.BookStatus.TO_BE_READ:
            # For TBR books, sort by date added
            books = queryset.order_by('-date_added')
        else:
            books = queryset

        serializer = UserBookSerializer(books, many=True)
        return Response({
            'success': True,
            'data': serializer.data,
            'message': 'Books retrieved successfully'
        })

    # # TODO: currently unused
    # def retrieve(self, request, pk=None):
    #     """
    #     Gets a single book by its work_id.
    #     """
    #     try:
    #         book = UserBook.objects.get(user=request.user, work_id=pk)
    #         serializer = UserBookSerializer(book)
    #         return Response({
    #             'success': True,
    #             'data': serializer.data,
    #             'message': 'Book retrieved successfully'
    #         })
    #     except UserBook.DoesNotExist:
    #         return Response({
    #             'success': False,
    #             'error': 'Book not found',
    #             'message': 'No book found with that work_id'
    #         }, status=status.HTTP_404_NOT_FOUND)


    def create(self, request):
        """
        Creates a new UserBook. Can be either read (with bucket) or TBR.
        """
        serializer = UserBookCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            book = Book.objects.get(work_id=serializer.validated_data['work_id'])
        except Book.DoesNotExist:
            raise ValidationError("No book found with that work_id")
        
        UserBook.objects.create(
            user=request.user,
            work_id=book.work_id,
            title=book.title,
            author=book.author,
            description=book.description,
            image_url=book.image_url,
            book_type=book.book_type,
            genre=book.genre,
            ratings_count=book.ratings_count,
            average_rating=book.average_rating,
            status=serializer.validated_data['status'],
            bucket=serializer.validated_data.get('bucket')
        )

        if serializer.validated_data['status'] == UserBook.BookStatus.READ:
            request.session[book.work_id] = {
                'compared_books': [],
                'valid_comparison_count': 0
            }
            request.session.save()
        
        return Response({
            'success': True,
            'message': 'Book added successfully'
        })

    def destroy(self, request, pk=None):
        """
        Deletes a book from user's library.
        """
        book = UserBook.objects.get(user=request.user, work_id=pk)
        book.delete()
        
        return Response({
            'success': True,
            'message': 'Book removed successfully'
        })

    def partial_update(self, request, pk=None):
        """
        Updates a book's status and/or bucket.
        """
        serializer = UserBookUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        UserBook.objects.update_book_status(
            user=request.user,
            work_id=pk,
            status=serializer.validated_data['status'],
            bucket=serializer.validated_data.get('bucket')
        )

        if serializer.validated_data['status'] == UserBook.BookStatus.READ:
            request.session[pk] = {
                'compared_books': [],
                'valid_comparison_count': 0
            }
            request.session.save()
        
        return Response({
            'success': True,
            'message': 'Book updated successfully'
        })



class CompareBookView(APIView):
    """
    This view contains the logic for fetching comparison books and updating the elo ratings post-comparison.
    """
    def post(self, request):
        """
        Gets the book to compare with the current book.
        """
        serializer = CompareBookRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        work_id = serializer.validated_data['work_id']
        user = request.user

        # Initialize session data if needed
        if work_id not in request.session:
            request.session[work_id] = {
                'compared_books': [],
                'valid_comparison_count': 0
            }
            request.session.save()

        # Get comparison book using manager method
        comparison_book, status_message = UserBook.objects.get_comparison_book(
            user=user,
            work_id=work_id,
            excluded_work_ids=request.session[work_id]['compared_books'],
            valid_comparison_count=request.session[work_id]['valid_comparison_count']
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

    def patch(self, request):
        """
        Updates the ratings of two books after a comparison.
        """
        serializer = CompareBookUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        work_id = serializer.validated_data['new_book_id']
        other_work_id = serializer.validated_data['existing_book_id']
        outcome = serializer.validated_data['outcome']
        user = request.user
        
        if not request.session.session_key:
            request.session.save()
        
        # Add to compared books regardless of outcome
        request.session[work_id]['compared_books'].append(other_work_id)
        
        # Only increment valid comparison count if outcome is not -1
        if outcome != -1:
            request.session[work_id]['valid_comparison_count'] = request.session[work_id].get('valid_comparison_count', 0) + 1
        
        request.session.save()

        # Only update ratings if outcome is not -1 (not comparable)
        if outcome != -1:
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
        Fetches up to 5 highest-scoring unviewed recommendations for the current user.
        """
        user = request.user
        recommendations = UserRecommendation.objects.get_unviewed_recommendations(user)
        
        if recommendations:
            serializer = UserRecommendationSerializer(recommendations, many=True)
            return Response({
                'success': True,
                'data': serializer.data,
                'message': 'Recommendations retrieved successfully'
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
        serializer = RecommendationViewSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        UserRecommendation.objects.mark_recommendation_as_viewed(
            user=request.user,
            work_id=serializer.validated_data['work_id']
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
        serializer = RecommendationCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        added_count = UserRecommendation.objects.add_recommendations_from_seed(
            user=request.user,
            work_id=serializer.validated_data['work_id']
        )

        return Response({
            'success': True,
            'message': f'Added {added_count} recommendations successfully'
        })

    def delete(self, request):
        """
        Deletes the most similar recommendation to the one provided.
        """
        serializer = RecommendationViewSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        UserRecommendation.objects.delete_similar_recommendation(
            user=request.user,
            work_id=serializer.validated_data['work_id']
        )

        return Response({
            'success': True,
            'message': 'Similar recommendation removed successfully'
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
        unranked_books = UserBook.objects.get_unranked_books(user)
        
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



# TODO: some of this logic should be moved but not important right now
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
            process_csv.delay(file_full_path, request.user.id)
            
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

class UserView(APIView):
    """
    This view returns the current user's data.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """
        Gets the current user's data.
        """
        serializer = UserAccountSerializer(request.user)
        return Response({
            'success': True,
            'data': serializer.data,
            'message': 'User data retrieved successfully'
        })