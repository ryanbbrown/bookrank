import React, { useState } from 'react';
import axios from 'axios';
import axiosInstance from '.././axiosConfig';
import { Link } from 'react-router-dom';

function FileUpload() {
    const [file, setFile] = useState(null);
    const [message, setMessage] = useState('');

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await axiosInstance.post('api/goodreads-import/', formData, {
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
                Visit the <a href="https://www.goodreads.com/review/import" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700 underline">Import/Export page on Goodreads</a> and click the "Export Library" button.
            </p>

            <h2 className="text-xl font-bold mb-1">Step 2</h2>
            <p className="mb-4">
                If desired, make any edits to the exported CSV file. This includes updating the "Date Read" column, which
                is sometimes not properly tracked. The column names must match the default names and order from Goodreads,
                so don't modify them.
            </p>

            <h2 className="text-xl font-bold mb-1">Step 3</h2>
            <p className="mb-2">
                Upload (or drag and drop) the file you downloded in <b>Step 1</b>.
            </p>
            <form onSubmit={handleSubmit}>
                <input type="file" accept=".csv" onChange={handleFileChange} className="mb-4" />
                <h2 className="text-xl font-bold mb-1">Step 4</h2>
                <p className="mb-2">
                    Click the button to begin the import process.
                </p>
                <button className="p-2 text-md text-white bg-teal-800 hover:bg-teal-900 rounded w-1/4" type="submit" style={{ display: 'block', marginTop: '10px' }}>
                    Upload
                </button>
            </form>
            {message && <p className="mb-4">{message}</p>}

            <h2 className="text-xl font-bold mb-1 mt-4">Step 5</h2>
            <p className="mb-2">
                Once the books have been uploaded, you can start ranking them! Go to <Link to="/mybooks" className="text-blue-500 hover:text-blue-700 underline">My Books</Link> and click
                the "Rank unranked books" button at the top of the page.
            </p>
        </div>
    );
}

export default FileUpload;
