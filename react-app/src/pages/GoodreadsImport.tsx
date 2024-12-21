import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from '../axiosConfig';
import { Button } from '../components/ui/button';
import { ApiResponse } from '../types/types';

function GoodreadsImport() {
    const [file, setFile] = useState<File | null>(null);
    const [message, setMessage] = useState<string>('');

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await axiosInstance.post<ApiResponse<never>>('api/goodreads-import/', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            setMessage('File uploaded successfully!');
            console.log('File uploaded successfully:', response.data);
        } catch (error) {
            setMessage('Error uploading file. Please try again.');
            console.error('Error uploading file:', error);
        }
    };

    return (
        <div className="container mx-auto flex flex-col p-4 pt-6 sm:w-4/5 md:w-3/4 lg:w-2/3 xl:w-1/2 2xl:w-1/2">
            <h1 className="text-4xl font-bold mb-4 text-center">Import books from Goodreads</h1>
            
            <h2 className="text-xl font-bold mb-1">Step 1</h2>
            <p className="mb-4">
                Visit the{' '}
                <a 
                    href="https://www.goodreads.com/review/import" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-blue-500 hover:text-blue-700 underline"
                >
                    Import/Export page on Goodreads
                </a>{' '}
                and click the "Export Library" button.
            </p>

            <h2 className="text-xl font-bold mb-1">Step 2</h2>
            <p className="mb-4">
                If desired, make any edits to the exported CSV file. This includes updating the "Date Read" column, which
                is sometimes not properly tracked. The column names must match the default names and order from Goodreads,
                so don't modify them.
            </p>

            <h2 className="text-xl font-bold mb-1">Step 3</h2>
            <p className="mb-2">
                Upload (or drag and drop) the file you downloaded in <b>Step 1</b>.
            </p>
            
            <form onSubmit={handleSubmit}>
                <input 
                    type="file" 
                    accept=".csv" 
                    onChange={handleFileChange} 
                    className="mb-4" 
                />
                
                <h2 className="text-xl font-bold mb-1">Step 4</h2>
                <p className="mb-2">
                    Click the button to begin the import process.
                </p>
                
                <Button 
                    type="submit" 
                    className="bg-teal-800 hover:bg-teal-900 text-white w-1/4 mt-2"
                >
                    Upload
                </Button>
            </form>
            
            {message && <p className="mb-4">{message}</p>}

            <h2 className="text-xl font-bold mb-1 mt-4">Step 5</h2>
            <p className="mb-2">
                Once the books have been uploaded, you can start ranking them! Go to{' '}
                <Link to="/mybooks" className="text-blue-500 hover:text-blue-700 underline">
                    My Books
                </Link>{' '}
                and click the "Rank unranked books" button at the top of the page.
            </p>
        </div>
    );
}

export default GoodreadsImport; 