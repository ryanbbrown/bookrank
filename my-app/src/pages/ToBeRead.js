import React, { useState, useEffect } from 'react';
import axios from 'axios';
import axiosInstance from '.././axiosConfig';

function ToBeRead() {
  const [books, setBooks] = useState([]);

  useEffect(() => {
    // axiosInstance.defaults.headers.common['Authorization'] = 'Token ' + localStorage.getItem('token');
    axiosInstance.get('api/to-be-read/')
      .then(response => {
        setBooks(response.data);
      })
      .catch(error => {
        console.error(error);
      });
  }, []);

  return (
    <div className="container mx-auto flex flex-col p-4 pt-6 sm:w-4/5 md:w-3/4 lg:w-2/3 xl:w-1/2 2xl:w-1/2">
      <h1 className="text-4xl font-bold mb-4 text-center">To Be Read</h1>
      <table className="table-fixed w-full">
        <thead>
          <tr className="bg-gray-300">
            <th className="px-4 py-2 text-center text-lg">Title</th>
            <th className="px-4 py-2 text-center text-lg">Author</th>
          </tr>
        </thead>
        <tbody>
          {books.map(book => (
            <tr key={book.id}>
              <td className="px-4 py-2 text-center">{book.title}</td>
              <td className="px-4 py-2 text-center">{book.author}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ToBeRead;