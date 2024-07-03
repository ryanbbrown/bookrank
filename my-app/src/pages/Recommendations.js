import React, { useEffect, useState } from 'react';
import axios from 'axios';
import axiosInstance from '.././axiosConfig';


function Recommendations() {
    const [recommendation, setRecommendation] = useState(null);

    const fetchRecommendation = () => {
        axiosInstance.get('api/recommendations')
            .then(response => {
                setRecommendation(response.data);
            })
    }
    useEffect(() => {
        fetchRecommendation();
    }, []);

    const handleYesClick = () => {
        axiosInstance.post('api/to-be-read/', {
            work_id: recommendation.work_id,
            title: recommendation.title,
            author: recommendation.author,
        })
            .then(() => {
                axiosInstance.post('api/recommendations/', { work_id: recommendation.work_id })
                    .then(() => {
                        fetchRecommendation();
                    })
            })
    }

    const handleNoClick = () => {
        axiosInstance.post('api/recommendations/', { work_id: recommendation.work_id })
            .then(() => {
                fetchRecommendation();
            })
    }

    return (
        <div className="container mx-auto flex flex-col p-4 pt-6 sm:w-4/5 md:w-3/4 lg:w-2/3 xl:w-1/2 2xl:w-1/2">
            <h1 className="text-4xl font-bold mb-4 text-center">Recommendations</h1>
            {recommendation && (
                <div className="bg-gray-200 p-6 rounded shadow-md text-center">
                    <img src={recommendation.image_url} className="mx-auto mb-4" />
                    <h2 className="text-2xl font-bold mb-4">{recommendation.title}</h2>
                    <h3 className="text-xl mb-4">{recommendation.author}</h3>
                    <p className="text-xs mb-4">{recommendation.description}</p>
                    <div className="flex justify-between mt-6">
                        <button onClick={handleNoClick} className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">No</button>
                        <button onClick={handleYesClick} className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">Yes</button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Recommendations;
