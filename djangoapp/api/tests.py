from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework.authtoken.models import Token
from djangoapp.models import UserAccount, UserBook, TBRBook, UserRecommendation
import random
import string

class BookAPITestCase(TestCase):
    def setUp(self):
        """Set up test data and client"""
        self.client = APIClient()
        
        # Generate random username for signup test
        random_digits = ''.join([str(random.randint(0, 9)) for _ in range(4)])
        self.test_username = f'testuser{random_digits}'
        self.test_password = 'password'

        # Create the test user that will be used in test_book_management
        self.test_user = UserAccount.objects.create_user(
            username='testimport4',
            password='password'
        )

    def test_auth_flow(self):
        """Test authentication flow: login, failed login, signup, logout, login new user"""
        # create the existing user
        # UserAccount.objects.create_user(username='testimport4', password='password')

        # Test login with existing user
        response = self.client.post('/api/login/', {
            'username': 'testimport4',
            'password': 'password'
        }, format='json')
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data['success'])
        self.assertTrue('token' in response.data['data'])

        # Test login with non-existing user
        random_username = ''.join(random.choices(string.ascii_letters, k=10))
        random_password = ''.join(random.choices(string.ascii_letters, k=10))
        response = self.client.post('/api/login/', {
            'username': random_username,
            'password': random_password
        }, format='json')
        self.assertEqual(response.status_code, 401)
        self.assertFalse(response.data['success'])

        # Test signup
        response = self.client.post('/api/signup/', {
            'username': self.test_username,
            'password': self.test_password,
            'password_confirm': self.test_password
        }, format='json')
        self.assertEqual(response.status_code, 201)
        self.assertTrue(response.data['success'])
        self.assertTrue('token' in response.data['data'])
        self.signup_token = response.data['data']['token']

        # Test logout
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.signup_token}')
        response = self.client.post('/api/logout/', format='json')
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data['success'])

        # Test login with newly created user
        response = self.client.post('/api/login/', {
            'username': self.test_username,
            'password': self.test_password
        }, format='json')
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data['success'])
        self.assertTrue('token' in response.data['data'])
        self.new_user_token = response.data['data']['token']

        # Logout again
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.new_user_token}')
        response = self.client.post('/api/logout/', format='json')
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data['success'])







    def test_book_management(self):
        """Test book management flow with the new user"""
        # Login as new user first
        response = self.client.post('/api/signup/', {
            'username': self.test_username,
            'password': self.test_password,
            'password_confirm': self.test_password
        }, format='json')
        self.assertEqual(response.status_code, 201)
        self.assertTrue(response.data['success'])
        self.assertTrue('token' in response.data['data'])
        self.token = response.data['data']['token']
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token}')

        # Search for Hunger Games
        response = self.client.get('/api/search/', {'query': 'Hunger Games'})
        self.assertEqual(response.status_code, 200)
        hunger_games = response.data['data'][0]

        # Add Hunger Games as finished book
        response = self.client.post('/api/userbooks/', {
            'work_id': hunger_games['work_id'],
            'title': hunger_games['title'],
            'author': hunger_games['author'],
            'rating': 'high'
        }, format='json')
        self.assertEqual(response.status_code, 200)

        # Add recommendations for Hunger Games
        response = self.client.post('/api/add-recommendations/', {
            'work_id': hunger_games['work_id']
        }, format='json')
        self.assertEqual(response.status_code, 200)

        # Check comparison (should be empty)
        response = self.client.get('/api/compare-book/', data={
            'work_id': hunger_games['work_id']
        })
        self.assertEqual(response.status_code, 200)
        self.assertIsNone(response.data['data'])

        # Search for Mistborn
        response = self.client.get('/api/search/', {'query': 'mistborn'})
        self.assertEqual(response.status_code, 200)
        mistborn = response.data['data'][1]  # Second result

        # Add Mistborn as finished book
        response = self.client.post('/api/userbooks/', {
            'work_id': mistborn['work_id'],
            'title': mistborn['title'],
            'author': mistborn['author'],
            'rating': 'high'
        }, format='json')
        self.assertEqual(response.status_code, 200)

        # Add recommendations for Mistborn
        response = self.client.post('/api/add-recommendations/', {
            'work_id': mistborn['work_id']
        }, format='json')
        self.assertEqual(response.status_code, 200)

        # Get comparison (should return Hunger Games)
        response = self.client.get('/api/compare-book/', {
            'work_id': mistborn['work_id']
        })
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['data']['work_id'], hunger_games['work_id'])

        # Compare books (Mistborn wins)
        response = self.client.post('/api/compare-book/', {
            'new_book_id': mistborn['work_id'],
            'existing_book_id': hunger_games['work_id'],
            'outcome': 1
        }, format='json')
        self.assertEqual(response.status_code, 200)

        # Verify ratings
        mistborn_rating = UserBook.objects.get(
            user__username=self.test_username,
            work_id=mistborn['work_id']
        )
        hunger_games_rating = UserBook.objects.get(
            user__username=self.test_username,
            work_id=hunger_games['work_id']
        )
        self.assertGreater(mistborn_rating.elo_rating, hunger_games_rating.elo_rating)

        # Search for The Broken Earth
        response = self.client.get('/api/search/', {'query': 'the broken earth'})
        self.assertEqual(response.status_code, 200)
        broken_earth_1 = response.data['data'][0]
        broken_earth_2 = response.data['data'][2]

        # Add both to TBR
        for book in [broken_earth_1, broken_earth_2]:
            response = self.client.post('/api/to-be-read/', {
                'work_id': book['work_id'],
                'title': book['title'],
                'author': book['author'],
                'image_url': book['image_url']
            }, format='json')
            self.assertEqual(response.status_code, 200)

        # Verify TBR list
        response = self.client.get('/api/to-be-read/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data['data']), 2)

        # Process first TBR book
        # Add as finished book
        response = self.client.post('/api/userbooks/', {
            'work_id': broken_earth_1['work_id'],
            'title': broken_earth_1['title'],
            'author': broken_earth_1['author'],
            'rating': 'high'
        }, format='json')
        self.assertEqual(response.status_code, 200)

        # Add recommendations
        response = self.client.post('/api/add-recommendations/', {
            'work_id': broken_earth_1['work_id']
        }, format='json')
        self.assertEqual(response.status_code, 200)

        # Delete from TBR
        response = self.client.delete(f'/api/to-be-read/?work_id={broken_earth_1["work_id"]}')
        self.assertEqual(response.status_code, 200)

        # Run comparisons until empty (should be 2 times)
        comparison_count = 0
        while True:
            response = self.client.get('/api/compare-book/', {
                'work_id': broken_earth_1['work_id']
            })
            if not response.data['data']:
                break
            
            compared_book = response.data['data']
            response = self.client.post('/api/compare-book/', {
                'new_book_id': broken_earth_1['work_id'],
                'existing_book_id': compared_book['work_id'],
                'outcome': 0
            }, format='json')
            self.assertEqual(response.status_code, 200)
            comparison_count += 1

        self.assertEqual(comparison_count, 2)

        # Verify TBR list has one book
        response = self.client.get('/api/to-be-read/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data['data']), 1)

        # Verify user books has three books
        response = self.client.get('/api/userbooks/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data['data']), 3)

        # Process second TBR book
        # Add as finished book
        response = self.client.post('/api/userbooks/', {
            'work_id': broken_earth_2['work_id'],
            'title': broken_earth_2['title'],
            'author': broken_earth_2['author'],
            'rating': 'high'
        }, format='json')
        self.assertEqual(response.status_code, 200)

        # Add recommendations
        response = self.client.post('/api/add-recommendations/', {
            'work_id': broken_earth_2['work_id']
        }, format='json')
        self.assertEqual(response.status_code, 200)

        # Delete from TBR
        response = self.client.delete(f'/api/to-be-read/?work_id={broken_earth_2["work_id"]}')
        self.assertEqual(response.status_code, 200)

        # Run comparisons until empty (should be 3 times)
        comparison_count = 0
        while True:
            response = self.client.get('/api/compare-book/', {
                'work_id': broken_earth_2['work_id']
            })
            if not response.data['data']:
                break
            
            compared_book = response.data['data']
            response = self.client.post('/api/compare-book/', {
                'new_book_id': broken_earth_2['work_id'],
                'existing_book_id': compared_book['work_id'],
                'outcome': 1
            }, format='json')
            self.assertEqual(response.status_code, 200)
            comparison_count += 1

        self.assertEqual(comparison_count, 3)

        # Verify TBR list is empty
        response = self.client.get('/api/to-be-read/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data['data']), 0)

        # Verify user books has four books
        response = self.client.get('/api/userbooks/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data['data']), 4) 


        # Test recommendations flow
        recommendation_count = 0
        while True:
            # Get next recommendation
            response = self.client.get('/api/recommendations/')
            self.assertEqual(response.status_code, 200)
            
            if not response.data['data']:
                break
                
            recommendation = response.data['data']
            
            # Every third recommendation, add to TBR
            if recommendation_count % 3 == 0:
                response = self.client.post('/api/to-be-read/', {
                    'work_id': recommendation['work_id'],
                    'title': recommendation['title'], 
                    'author': recommendation['author'],
                    'image_url': recommendation['image_url']
                }, format='json')
                self.assertEqual(response.status_code, 200)
            
            # Mark recommendation as viewed
            response = self.client.post('/api/recommendations/', {
                'work_id': recommendation['work_id']
            }, format='json')
            self.assertEqual(response.status_code, 200)
            
            recommendation_count += 1
        self.assertEqual(recommendation_count, 12)