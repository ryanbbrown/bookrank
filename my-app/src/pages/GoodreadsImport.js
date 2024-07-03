import React, { useState } from 'react';
import axios from 'axios';
import axiosInstance from '.././axiosConfig';

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
      <h1 className="text-4xl font-bold mb-4 text-center">Goodreads Import</h1>
      <p className="mb-4">
        To import your reading list from Goodreads, please upload a CSV file containing your book data.
        Ensure that the file is properly formatted as per the guidelines provided.
      </p>
      <form onSubmit={handleSubmit}>
        <input type="file" accept=".csv" onChange={handleFileChange} className="mb-4"/>
        <button className="w-full p-2 text-sm bg-gray-200 hover:bg-gray-300 rounded" type="submit" style={{ display: 'block', marginTop: '10px' }}>
          Upload
        </button>
      </form>
      {message && <p className="mt-4">{message}</p>}
    </div>
  );
}

export default FileUpload;
