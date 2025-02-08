from locust import HttpUser, task, between
import random
from urllib.parse import quote
from sqlalchemy import create_engine
import pandas as pd
import time
CONN_STRING = "postgresql://doadmin:AVNS_N2Vzxu2yreQP00V6kUs@bookrank-postgres-db-do-user-17087350-0.m.db.ondigitalocean.com:25060/defaultdb?sslmode=require"

def run_query_sqlalchemy(query, params=None):
    engine = create_engine(CONN_STRING)
    try:
        return pd.read_sql_query(query, engine, params=params)
    finally:
        engine.dispose()

df = run_query_sqlalchemy("SELECT work_id, title FROM djangoapp_book ORDER BY ratings_count DESC LIMIT 10000;")
print('ran initial query')
COMMON_BOOKS = df['title'].tolist()
COMMON_WORK_IDS = df['work_id'].tolist()


class WebsiteUser(HttpUser):
    # Wait between 1 to 5 seconds between tasks
    # wait_time = between(10, 30)
    wait_time = between(5, 15)
    
    def on_start(self):
        """Initialize user session if needed (e.g., login)"""
        # If your app requires authentication
        seed = random.randint(1, 1000000)
        response = self.client.post("/api/signup/", {
            "username": f"testuser_{seed}",
            "password": f"testpass_{seed}",
            "password_confirm": f"testpass_{seed}",
        })

        # Debug: Print response details
        # print(f"Signup Response Status: {response.status_code}")
        # print(f"Signup Response Headers: {response.headers}")
        # print(f"Signup Response Body: {response.text}")
        
        # If using token auth, capture and store token
        # if response.json().get('token'):
        self.token = response.json()['data']['token']
        self.client.headers.update({'Authorization': f'Token {self.token}'})
    
    @task(1)
    def view_home(self):
        """Simulate viewing the home page"""
        self.client.get("/")
        
    @task(6)
    def search_book(self):
        """Simulate API calls your React app makes"""
        query = quote(random.choice(COMMON_BOOKS))
        self.client.get(f"/search?q={query}", name='name="/search?q="')

    @task(6)
    def view_read_books(self):
        """Simulate viewing my books"""
        self.client.get("/mybooks/read")

    @task(2)
    def view_to_be_read_books(self):
        """Simulate viewing my books"""
        self.client.get("/mybooks/to_be_read")

    @task(1)
    def view_currently_reading_books(self):
        """Simulate viewing my books"""
        self.client.get("/mybooks/currently_reading")

    @task(1)
    def add_read_book(self):
        self.client.post("/api/userbooks/", {
            "status": "read",
            "work_id": random.choice(COMMON_WORK_IDS)
        })

    @task(2)
    def add_to_be_read_book(self):
        self.client.post("/api/userbooks/", {
            "status": "to_be_read",
            "work_id": random.choice(COMMON_WORK_IDS)
        })

    @task(2)
    def add_currently_reading_book(self):
        self.client.post("/api/userbooks/", {
            "status": "currently_reading",
            "work_id": random.choice(COMMON_WORK_IDS)
        })

    @task(5)
    def add_read_book_and_compare(self):
        ref_id = random.choice(COMMON_WORK_IDS)
        self.client.post("/api/userbooks/", {
            "status": "read",
            "work_id": ref_id
        })
        
        for i in range(3):
            time.sleep(1)
            try:
                response = self.client.post("/api/compare-book/", {
                    "work_id": ref_id
                })
                other_work_id = response.json()['data']['work_id']
                self.client.patch("/api/compare-book/", {
                    "existing_book_id": ref_id,
                    "new_book_id": other_work_id,
                    "outcome": random.choice([0, 1, 0.5])
                })
            except Exception as e:
                if i > 0:
                    # this is a proper kind of fail, aka they did have some successful comparisons
                    print(f'{i} failed: {e}')
                return
            
    @task(4)
    def recommendation_swipe(self):
        pass





    
        
        
        
    # Add more @task methods to simulate real user behavior
    # The number in @task(n) represents the relative weight of this task