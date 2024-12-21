from pinecone import Pinecone
import os
from dotenv import load_dotenv

load_dotenv()

class PineconeService:
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialize()
        return cls._instance
    
    def _initialize(self):
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