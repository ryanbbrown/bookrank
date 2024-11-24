# tasks.py
from celery import shared_task
import pandas as pd
from django.core.files.storage import default_storage
from djangoapp.models import UserBookRating, UserAccount
from opensearchpy import OpenSearch, RequestsHttpConnection
from dotenv import load_dotenv
load_dotenv()
import os
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

# Get a specific logger for this module
logger = logging.getLogger(__name__)

HOST = 'https://search-bookrank-testing-6jgeuos7njdnqf5yzhbutmoea4.us-east-2.es.amazonaws.com' 
MASTER_USER = os.getenv('MASTER_USER')
MASTER_PASSWORD = os.getenv('MASTER_PASSWORD')
INDEX_NAME = 'goodreads_books'

client = OpenSearch(
    hosts=[HOST],
    http_auth=(MASTER_USER, MASTER_PASSWORD),
    use_ssl=True,
    verify_certs=True,
    connection_class=RequestsHttpConnection
)

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

        return df
        # return [(book, author) for book, author in zip(df['title'], df['author_name'])]
    except Exception as e:
        raise e


@shared_task
def process_csv(file_path, user_id):
    try:
        user = UserAccount.objects.get(id=user_id)
        # Read the CSV file into a pandas DataFrame
        df_goodreads = pd.read_csv(file_path)
        logger.info('Finished reading csv')

        df_goodreads['Search'] = df_goodreads['Title'] + ' ' + df_goodreads['Author']
        df_goodreads = df_goodreads[df_goodreads['Exclusive Shelf']=='read']
        logger.info('Finished processing csv')

        res_df_list = []
        query_list = df_goodreads['Search'].tolist()
        for q in query_list:
            try:
                res_df = search(q)
                res_df_list.append(res_df)
                print(f"Processed query: {q}")
            except:
                query_list.remove(q)
        logger.info('Finished searching')

        existing_work_ids = (
            UserBookRating.objects
            .filter(user=user)
            .values_list('work_id', flat=True)
        )
        for i in range(len(query_list)):
            records = res_df_list[i].to_dict(orient='records')
            pct_diff = records[0]['score'] / records[1]['score'] - 1
            if pct_diff >= 0.2 and records[0]['work_id'] not in existing_work_ids:
                print(f"Adding book: {records[0]['title']}")
                logger.info(records[0])
                UserBookRating.objects.create(
                    user=user,
                    work_id=records[0]['work_id'],
                    title=records[0]['title'],
                    author=records[0]['author'],
                    image_url=records[0]['image_url'],
                )

        # Cleanup: delete the file after processing
        default_storage.delete(file_path)
    except Exception as e:
        # Handle exceptions
        print(f"Error processing CSV: {str(e)}")