from pinecone import Pinecone
import os
from dotenv import load_dotenv
from opensearchpy import OpenSearch, RequestsHttpConnection
import pandas as pd
from scipy.spatial.distance import cosine

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
    
    def get_work_to_remove(self, all_work_ids, bad_work_id):
        """
        Given all a users recommendations, and the recommendation they said no to,
        find the single most similar rec to that rec, so it can be removed.

        TODO: should be more complex logic based on analysis and etc
        """
        recs = self.index.fetch(ids=all_work_ids)
        target_work_ids = [id for id in all_work_ids if id != bad_work_id]

        if not target_work_ids:
            return None

        vector_dict = {
            key: value.values for key, value in recs['vectors'].items()
        }

        distance_dict = {
            key: cosine(vector_dict[bad_work_id], vector_dict[key]) for key in target_work_ids
        }

        return min(distance_dict, key=distance_dict.get)



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

    def search(self, query, filters=None):
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

        # skeleton to add filters if provided
        # TODO: currently no way to pass from frontend
        if filters:
            for field, conditions in filters.items():
                for operator, value in conditions.items():
                    if operator == 'gt':
                        search_query["query"]["function_score"]["query"]["bool"]["filter"].append(
                            {"range": {field: {"gt": value}}}
                        )
                    elif operator == 'gte':
                        search_query["query"]["function_score"]["query"]["bool"]["filter"].append(
                            {"range": {field: {"gte": value}}}
                        )
                    elif operator == 'lt':
                        search_query["query"]["function_score"]["query"]["bool"]["filter"].append(
                            {"range": {field: {"lt": value}}}
                        )
                    elif operator == 'lte':
                        search_query["query"]["function_score"]["query"]["bool"]["filter"].append(
                            {"range": {field: {"lte": value}}}
                        )
                    elif operator == 'eq':
                        search_query["query"]["function_score"]["query"]["bool"]["filter"].append(
                            {"term": {field: value}}
                        )

        response = self.client.search(index=self.index_name, body=search_query)
        try:
            hitlist = response['hits']['hits']
            print(hitlist[0])
            # 'ratings_count', 
            rowlist = [dict({'score': hit['_score']}, **hit['_source']) for hit in hitlist]
            df = pd.DataFrame(rowlist).rename(columns={'author_name': 'author'})

            return df[['work_id', 'title', 'author', 'image_url', 'description']].to_dict(orient='records')
        except Exception as e:
            raise e 