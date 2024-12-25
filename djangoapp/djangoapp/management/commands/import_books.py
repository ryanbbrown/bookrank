from django.core.management.base import BaseCommand
from django.db import transaction
from djangoapp.models import Book
import pandas as pd
import duckdb
from tqdm import tqdm

class Command(BaseCommand):
    help = 'Import books from Goodreads parquet file into the Book table'

    def add_arguments(self, parser):
        parser.add_argument(
            '--chunk-size',
            type=int,
            default=1000,
            help='Number of books to process in each batch'
        )
        parser.add_argument(
            '--data-path',
            type=str,
            default='~/projects/bookrank/app/data/goodreads_joined.parquet',
            help='Path to the parquet file'
        )

    def handle(self, *args, **options):
        chunk_size = options['chunk_size']
        data_path = options['data_path']

        self.stdout.write(f'Loading data from {data_path}...')

        # SQL query to fetch and transform the data
        sql = f"""
        SELECT
            work_id,
            title,
            author_name as author,
            description,
            image_url,
            CASE 
                WHEN RANDOM() < 0.4 THEN 'Fiction'
                WHEN RANDOM() < 0.8 THEN 'Non-Fiction' 
                ELSE 'Children'
            END as book_type,
            CASE 
                WHEN RANDOM() < 0.111 THEN 'Science Fiction'
                WHEN RANDOM() < 0.222 THEN 'Fantasy'
                WHEN RANDOM() < 0.333 THEN 'Mystery'
                WHEN RANDOM() < 0.444 THEN 'Romance'
                WHEN RANDOM() < 0.555 THEN 'Thriller'
                WHEN RANDOM() < 0.666 THEN 'Horror'
                WHEN RANDOM() < 0.777 THEN 'Historical Fiction'
                WHEN RANDOM() < 0.888 THEN 'Classics'
                ELSE 'Contemporary'
            END as genre,
            ratings_count,
            avg_rating as average_rating
        FROM READ_PARQUET('{data_path}')
        WHERE author_name IS NOT NULL
        ORDER BY ordered_id ASC
        """

        # Execute the query and get the DataFrame
        df = duckdb.sql(sql).to_df()
        total_chunks = len(df) // chunk_size + (1 if len(df) % chunk_size else 0)

        self.stdout.write(f'Processing {len(df)} books in chunks of {chunk_size}...')

        # Process the DataFrame in chunks
        with tqdm(total=total_chunks) as pbar:
            for i in range(0, len(df), chunk_size):
                chunk = df.iloc[i:i + chunk_size]
                
                # Convert chunk to list of Book objects
                books = [
                    Book(
                        work_id=str(row.work_id),
                        title=row.title[:200],  # Ensure we don't exceed max_length
                        author=row.author[:100],
                        description=row.description,
                        image_url=row.image_url,
                        book_type=row.book_type,
                        genre=row.genre,
                        ratings_count=row.ratings_count,
                        average_rating=row.average_rating
                    )
                    for _, row in chunk.iterrows()
                ]

                # Bulk create books, ignore conflicts
                try:
                    with transaction.atomic():
                        Book.objects.bulk_create(
                            books,
                            batch_size=chunk_size,
                            ignore_conflicts=True
                        )
                except Exception as e:
                    self.stderr.write(f'Error processing chunk {i//chunk_size + 1}: {str(e)}')
                
                pbar.update(1)

        self.stdout.write(self.style.SUCCESS('Successfully imported books')) 