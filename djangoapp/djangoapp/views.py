# views.py
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import UserAccount, UserBookRating, UserToBeRead, UserRecommendation
from .serializers import UserAccountSerializer
import json
from django.contrib.auth import authenticate, login
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth.hashers import make_password
from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.authtoken.models import Token
from .serializers import UserBookRatingSerializer, UserToBeReadSerializer, UserRecommendationSerializer
# from django.db.models.query import RawQuery
from django.db.models.functions import Abs
from django.db.models import F
import math
import os
from django.db.models import Expression
from django.db.models.fields import FloatField
from rest_framework import status
import pandas as pd
from django.core.files.storage import default_storage

from opensearchpy import OpenSearch, RequestsHttpConnection
from dotenv import load_dotenv
load_dotenv()
from django.views.generic import TemplateView
from pathlib import Path
import logging




import pandas as pd
from pinecone import Pinecone
from groq import Groq
# from langchain_huggingface import HuggingFaceEmbeddings
from sentence_transformers import SentenceTransformer


HOST = 'https://search-bookrank-testing-6jgeuos7njdnqf5yzhbutmoea4.us-east-2.es.amazonaws.com'  # Replace with your domain endpoint

MASTER_USER = os.getenv('MASTER_USER')
MASTER_PASSWORD = os.getenv('MASTER_PASSWORD')
INDEX_NAME = 'goodreads_books'
PINECONE_API_KEY = os.getenv('PINECONE_API_KEY')
PINECONE_INDEX_NAME = 'goodreads-top-50k'
GROQ_API_KEY = os.getenv('GROQ_API_KEY')
EMBEDDING_MODEL = 'thenlper/gte-small'
SUMMARY_PROMPT = """
You are a chatbot designed to give one-sentences responses that connect a user query
and a book description. You should only ever reply with one sentence.

You will be given a user query a single book's title and description. Your goal is to generate one sentence
explaining how the book is relevant to the user query.

Below are some examples of expected output:


USER INPUT: Any fantasy with magical trials?
OUTPUT 1: 'The Iron Trial' is a perfect pick for you, as it centers around magical trials that determine the fate of young wizards.
OUTPUT 2: Furyborn is a perfect match for your search, featuring Rielle who must endure seven elemental magic trials to prove herself as the prophesied Sun Queen.
OUTPUT 3: The Wonderland Trials is a perfect pick for you, featuring magical trials in a fantastical Wonderland setting where players must solve clues and survive dangerous challenges.
OUTPUT 4: Sufficiently Advanced Magic is a perfect fit for your search, featuring a protagonist who must survive magical trails in a colossal tower to gain powers and find his lost brother.
OUTPUT 5: The Princess Trials is a thrilling fantasy book featuring magical trials where contestants compete for a prince's hand in a deadly, televised pageant.
OUTPUT 6: 'An Unkindness of Magicians' is a thrilling fantasy set in New York City, featuring magical trials and a powerful magician named Sydney who aims to disrupt the magical system.

USER INPUT: What books have thrilling heists?
OUTPUT 1: The palace job is a thrilling high-fantasy heist caper with a team of magical misfits on a dating mission to steal a priceless elven manuscript.
OUTPUT 2: 'Heist Society' is a thrilling adventure filled with high-stakes heists, perfect for anyone looking for a book about daring thefts and clever cons
OUTPUT 3: An Illusion of Thieves is a perfect pick for thrilling heists, featuring a ragtag crew using forbidden magic to pull off an elaborate heist and stop a civil war.
OUTPUT 4: 'Thick as thieves' is a perfect pick for you, as it dives deep into the thrilling aftermath of a heist gone wrong, with secrets unraveling and suspense at every turn
OUTPUT 5: California Bones is a thrilling heist adventure where ap petty thief and his team must break into a storehouse of magical artifacts in a fantastical version of Los Angeles
OUTPUT 6: 'The monsters We Defy' is a thrilling heist novel set in 1925 Washington D.C., blending magic, history, and a daring mission to steal a magical ring.


Below is the actual user query and book description you will be working with:
USER QUERY: {user_query}
BOOK TITLE: {book_title}
BOOK DESCRIPTION: {book_description}

"""

client = OpenSearch(
    hosts=[HOST],
    http_auth=(MASTER_USER, MASTER_PASSWORD),
    use_ssl=True,
    verify_certs=True,
    connection_class=RequestsHttpConnection
)

pc = Pinecone(api_key=PINECONE_API_KEY)
index = pc.Index(PINECONE_INDEX_NAME)

groq_client = Groq(api_key=GROQ_API_KEY)
embedding_model = SentenceTransformer(EMBEDDING_MODEL)

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

        return df[['work_id', 'title', 'author']].to_dict(orient='records')
        # return [(book, author) for book, author in zip(df['title'], df['author_name'])]
    except Exception as e:
        raise e

q = 0.01  # Constant used in Glicko rating system
def g(RD):
    return 1 / math.sqrt(1 + 3 * q**2 * RD**2 / math.pi**2)

def E(rating, opponent_rating, opponent_RD):
    return 1 / (1 + math.exp(-g(opponent_RD) * (rating - opponent_rating) / 400))



logger = logging.getLogger(__name__)

class LoginView(APIView):
    """
    This view logs in a user if they exist, otherwise creates a new user and logs them in.
    """
    def post(self, request):
        logger.info(f"Origin: {request.headers.get('Origin')}")
        username = request.data.get('username')
        password = request.data.get('password')
        print('Hello')
        print(f"CSRF Token in Cookie: {request.COOKIES.get('csrftoken')}")
        print(f"CSRF Token in Header: {request.headers.get('X-CSRFToken')}")
        
        # Check if the user already exists
        if UserAccount.objects.filter(username=username).exists():
            user = authenticate(request, username=username, password=password)
            
            if user is not None:
                login(request, user)
                token, created = Token.objects.get_or_create(user=user)
                return Response({'message': 'Logged in successfully', 'token': token.key})
            else:
                return Response({'message': 'Invalid username or password'}, status=400)
        else:
            # Create a new user and log them in
            user = UserAccount.objects.create(username=username, password=make_password(password))
            login(request, user)
            token, created = Token.objects.get_or_create(user=user)
            return Response({'message': 'Account created and logged in successfully', 'token': token.key})



class SearchView(APIView):
    """
    This view searches for books in the AWS OpenSearch client based on a query string.
    """
    def get(self, request):
        query = request.query_params.get('query')
        searchbooklist = search(query)
        print(searchbooklist)

        return Response(searchbooklist)



class AddFinishedBookView(APIView):
    # permission_classes = [IsAuthenticated]
    """
    This view adds a UserBookRating object to the database, associated with the current user.
    It is the only way that users can add finished books to their account.
    """
    def post(self, request):
        work_id = request.data.get('work_id')
        # title = request.data.get('title')
        # author = request.data.get('author')
        rating = request.data.get('rating')
        user = request.user
        
        # TODO: update_or_create here allows them to re-add existing book with new rating
        # not sure what it does to elo rating field
        pinecone_book = index.fetch(ids=[work_id])['vectors'][work_id]['metadata']

        user_book_rating, created = UserBookRating.objects.update_or_create(
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
        
        return Response({'message': 'Book added to account'})
    


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
        book_obj = UserBookRating.objects.get(work_id=work_id, user=user)
        rating = book_obj.rating
        elo_rating = book_obj.elo_rating

        # memory of which books the new book has been compared to so it doesn't repeat
        if work_id not in request.session:
            request.session[work_id] = {}
            request.session[work_id]['compared_books'] = []

        # gets potential comparison books in same rating bucket, sorted by elo rating difference
        queryset_results = (
            UserBookRating.objects
            .exclude(work_id=work_id)
            .exclude(work_id__in=request.session[work_id]['compared_books'])
            .filter(user=user, rating=rating)
            .annotate(rating_diff=Abs(F('elo_rating') - elo_rating))
            .order_by('rating_diff')
        )
        
        # return None and stop comparing if no similar books found or already compared to 3 books
        # TODO: change logic of comparing to 3 books?
        if queryset_results.count() == 0:
            print('no similar books found')
            book_obj.is_ranked = True
            book_obj.save()
            return Response(None)
        elif len(request.session[work_id]['compared_books']) == 3:
            print('compared to 3 books already')
            book_obj.is_ranked = True
            book_obj.save()
            return Response(None)
        
        # get book to compare
        book_to_compare = queryset_results.first()
        serializer = UserBookRatingSerializer(book_to_compare)

        return Response(serializer.data)

    
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
    

    def update_ratings(self, book_obj, other_book_obj, outcome):
        """
        Updates the elo ratings and RDs of two books after a comparison. Calls calc_new_rating.
        """
        new_rating, new_RD = self.calc_new_rating(book_obj, other_book_obj, outcome)
        other_new_rating, other_new_RD = self.calc_new_rating(other_book_obj, book_obj, 1 - outcome)

        book_obj.elo_rating = new_rating
        book_obj.RD = new_RD
        book_obj.save()

        other_book_obj.elo_rating = other_new_rating
        other_book_obj.RD = other_new_RD
        other_book_obj.save()


    def post(self, request):
        """
        Wrapper to get the relevant book objects and call the update_ratings method.
        """
        work_id = request.data.get('new_book_id')
        other_work_id = request.data.get('existing_book_id')
        outcome = request.data.get('outcome')
        user = request.user
        
        book_obj = UserBookRating.objects.get(work_id=work_id, user=user)
        other_book_obj = UserBookRating.objects.get(work_id=other_work_id, user=user)

        # add the compared book to the session memory
        request.session[work_id]['compared_books'].append(other_book_obj.work_id)
        request.session.save()

        self.update_ratings(book_obj, other_book_obj, outcome)

        return Response({'message': 'Rating updated successfully'})



class RecommendationView(APIView):
    """
    This view fetches recommendations for the current user and updates them as viewed post-interaction.
    """
    def get(self, request):
        """
        Fetches the highest-scoring unviewed recommendation for the current user.
        """
        user = request.user
        recommendation = (
            UserRecommendation
            .objects
            .filter(user=user)
            .filter(viewed=False)
            .order_by('-score')
            .first()
        )
        if recommendation:
            serializer = UserRecommendationSerializer(recommendation)
            return Response(serializer.data)
        else:
            return Response(None)
    

    def post(self, request):
        """
        Updates a recommendation as viewed so that it won't be shown again.
        """
        UserRecommendation.objects.filter(
            user=request.user,
            work_id=request.data.get('work_id')
        ).update(
            viewed=True
        )

        return Response({'message': 'Recommendation viewed'})
    


class AddRecommendationView(APIView):
    """
    This view contains the logic for generating recommendations and adding them to the database.
    """
    def get_books(self, work_id, k=10):
        """
        Given a seed book, fetches the top k recommendations from the Pinecone index.
        TODO: this is super basic right now and will need to be improved
        """
        seed_vector = index.fetch(ids=[work_id])['vectors'][work_id]['values']
        matches = index.query(top_k=k, vector=seed_vector, include_metadata=True)['matches'][1:]

        return matches


    def post(self, request):
        """
        Given a seed book, fetches the recommendations using the get_books method and adds them to the DB.
        This function currently runs every time the user adds a "high" bucketed book to their account.
        """
        work_id = request.data.get('work_id')
        seed_author = (
            index.fetch(ids=[work_id])
            ['vectors'][work_id]['metadata']['author_name']
        )
        
        recommendations = self.get_books(work_id)

        added_recs = 0
        for book in recommendations:
            if (
                not UserBookRating.objects.filter(work_id=book['id'], user=request.user).exists()
                and book['metadata']['author_name'] != seed_author
            ):
                
                UserRecommendation.objects.update_or_create(
                    user=request.user,
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

            if added_recs >= 3:
                break

        return Response({'message': 'Recommendations added to account'})



class UserBooksView(APIView):
    """
    Gets all of user's finished books and sorts them by rating to display on the frontend.
    """
    def get(self, request):
        user = request.user
        books = (
            UserBookRating
            .objects
            .filter(user=user)
        )
        ranked_books = list(books.filter(is_ranked=True))
        unranked_books = list(books.filter(is_ranked=False))
        sorted_ranked_books = (sorted(ranked_books, key=lambda x: (x.normalized_rating if x.normalized_rating is not None else 0), reverse=True))
        sorted_unranked_books = (sorted(unranked_books, key=lambda x: (x.date_added), reverse=True))
        sorted_books = sorted_ranked_books + sorted_unranked_books
        # sorted_books = (sorted(list(books), key=lambda x: (x.normalized_rating if x.normalized_rating is not None else 0), reverse=True))
        serializer = UserBookRatingSerializer(sorted_books, many=True)
        # print(serializer.data)
        return Response(serializer.data)
    


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
            UserToBeRead
            .objects
            .filter(user=user)
        )
        serializer = UserToBeReadSerializer(books, many=True)
        return Response(serializer.data)
    

    def post(self, request):
        """
        Adds a book to a user's TBR list.
        """
        work_id = request.data.get('work_id')
        title = request.data.get('title')
        author = request.data.get('author')
        user = request.user
        
        if not all([work_id, title, author]):
            return Response({'error': 'All fields are required'}, status=400)
        
        var = UserToBeRead.objects.create(
            user=user,
            work_id=work_id,
            title=title,
            author=author
            # defaults={'title': title, 'author': author}
        )
        print(var)
        
        return Response({'message': 'Book added to account'})
    

class ChatView(APIView):
    """
    This view contains the logic for generating chat responses.
    """
    def get(self, request):
        """
        Generates a chat response based on the user's input.
        """
        current_message = json.loads(request.query_params.get('current_message'))
        matches = json.loads(request.query_params.get('matches'))
        
        # return a default message if no user input
        if 'content' not in current_message:
            response = 'Hello! How can I assist you today?'
            return Response({'role': 'assistant', 'content': response, 'matches': matches})
        else:
            last_message_content = current_message['content']
            print('Last message content', last_message_content)

        # get matches from vector db if not passed
        if len(matches) == 0:
            vector = embedding_model.encode(last_message_content).tolist()
            matches = index.query(
                vector=vector,
                top_k=10,
                metric='cosine',
                include_metadata=True,
                include_values=False,
            ).to_dict()['matches']

        # get the first match and generate a response
        match = matches[0]
        filled_prompt = SUMMARY_PROMPT.format(
            user_query=last_message_content,
            book_description=match['metadata']['description'],
            book_title=match['metadata']['title'],
        )
        new_messages = [{'role': 'user', 'content': filled_prompt}]
        response = groq_client.chat.completions.create(
            messages=new_messages,
            model="llama3-8b-8192"
        )

        return Response({
            'content': response.choices[0].message.content,
            'image': match['metadata']['image_url'],
            'work_id': match['id'],
            'title': match['metadata']['title'],
            'author': match['metadata']['author_name'],
            'description': match['metadata']['description'],
            'matches': matches[1:]  # get rid of the match you just showed
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
            UserBookRating
            .objects
            .filter(user=user, is_ranked=False)
            .order_by('-date_added')
        )
        print(unranked_books.first())
        print(unranked_books.exists())
        if unranked_books.exists():
            serializer = UserBookRatingSerializer(unranked_books.first())
            return Response(serializer.data)
        else:
            return Response(None)




from djangoapp.tasks import process_csv
class GoodreadsImportView(APIView):
    """
    This view contains the logic for importing books from Goodreads to the user account.
    """
    def post(self, request, *args, **kwargs):
        file = request.FILES.get('file')
        
        if file is None or not file.name.endswith('.csv'):
            return Response({'error': 'Only CSV files are allowed.'}, status=status.HTTP_400_BAD_REQUEST)
        
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
            
            return Response({'message': 'Upload successful!'}, status=status.HTTP_201_CREATED)
        except Exception as e:
            print(e)
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


BASE_DIR = Path(__file__).resolve().parent.parent
REACT_APP_DIR = os.path.join(BASE_DIR, '../../my-app/build')
class ReactAppView(TemplateView):
    template_name = os.path.join(REACT_APP_DIR, 'index.html')