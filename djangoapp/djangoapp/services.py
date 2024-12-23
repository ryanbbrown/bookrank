from pinecone import Pinecone
import os
from dotenv import load_dotenv
from opensearchpy import OpenSearch, RequestsHttpConnection
import pandas as pd

load_dotenv()

class PineconeService:   
    def __init__(self):
        """Initialize Pinecone client and index"""
        self.client = Pinecone(api_key=os.getenv('PINECONE_API_KEY'))
        self.index = self.client.Index(os.getenv('PINECONE_INDEX_NAME'))
    
    def fetch_vector(self, work_id):
        """Fetch a single vector and its metadata"""
        return self.index.fetch(ids=[work_id])['vectors'][work_id]
    
    def query_similar(self, vector, k=10):
        """Query for similar vectors"""
        return self.index.query(
            top_k=k,
            vector=vector,
            include_metadata=True
        )['matches'][1:]

    def get_books_from_pinecone(self, work_id, k=10):
        """
        Given a seed book, fetches the top k recommendations from the Pinecone index.
        """
        seed_vector = self.fetch_vector(work_id)
        return self.query_similar(
            vector=seed_vector['values'],
            k=k
        )



class OpenSearchService:
    def __init__(self):
        """Initialize OpenSearch client and constants"""
        self.client = OpenSearch(
            hosts=[os.getenv('OPENSEARCH_HOST')],
            http_auth=(os.getenv('MASTER_USER'), os.getenv('MASTER_PASSWORD')),
            use_ssl=True,
            verify_certs=True,
            connection_class=RequestsHttpConnection
        )
        self.index_name = os.getenv('INDEX_NAME')

    def search(self, query):
        """Search for books in the OpenSearch index based on a query string"""
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

        response = self.client.search(index=self.index_name, body=search_query)
        try:
            hitlist = response['hits']['hits']
            rowlist = [dict({'score': hit['_score']}, **hit['_source']) for hit in hitlist]
            df = pd.DataFrame(rowlist).rename(columns={'author_name': 'author'})

            return df[['work_id', 'title', 'author', 'image_url', 'description']].to_dict(orient='records')
        except Exception as e:
            raise e 