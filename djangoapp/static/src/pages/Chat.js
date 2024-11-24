import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import axiosInstance from '.././axiosConfig';
import RateModal from '../components/RateModal';

const Chatbot = () => {
    const [messages, setMessages] = useState([]);
    const matchesRef = useRef([]);
    const currentMessageRef = useRef({});
    const [input, setInput] = useState('');
    const chatBoxRef = useRef(null);
    const [showPopup, setShowPopup] = useState(false);
    const [popupContent, setPopupContent] = useState({ title: '', cover: '', description: '' });

    useEffect(() => {
        // This useEffect will only run once when the component mounts, to fetch initial messages
        console.log('Chatbot mounted');
        handleGet();
    }, []);

    useEffect(() => {
        if (messages.length > 0) {
            const lastMessage = messages[messages.length - 1];
            // console.log('lastMessage:', lastMessage);
            if (lastMessage.role === 'user') {
                handleGet();
            }
        }
    }, [messages]);

    useEffect(() => {
        if (chatBoxRef.current) {
            chatBoxRef.current.scrollTo({
                top: chatBoxRef.current.scrollHeight,
                behavior: 'smooth'
            });
        }
    }, [messages]);


    const handleGet = () => {
        axiosInstance.get('api/chat', {
            params: {
                current_message: JSON.stringify(currentMessageRef.current),
                matches: JSON.stringify(matchesRef.current)
            }
        })
            .then(response => {
                const { content, image, work_id, title, author, description, matches } = response.data;
                matchesRef.current = matches;
                setMessages((prevMessages) => [
                    ...prevMessages,
                    { role: 'assistant', content, image, work_id, title, author, description }
                ]);
                console.log(messages);
            })
    }

    const handleInputChange = (e) => {
        setInput(e.target.value);
    };

    const handleSend = () => {
        if (input.trim() === '') return;

        matchesRef.current = [];
        currentMessageRef.current = { role: 'user', content: input, image: null };
        setMessages([...messages, { role: 'user', content: input, image: null }]);

        setInput('');
    };

    const handleNext = () => {
        setMessages([...messages, { role: 'user', content: 'Show me another recommendation', image: null }]);
        setInput('');
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleSend();
        }
    };

    const handleAddToTBR = ({ work_id, title, author }) => {
        axiosInstance.post('api/to-be-read/', { work_id, title, author })
            .then(response => {
                console.log('Added to TBR:', response.data);
            })
            .catch(error => {
                console.error('Error adding to TBR:', error);
            });
    };

    const handleViewDetails = ({ title, cover, image_url, description, author }) => {
        setPopupContent({ title, cover, image_url, description, author });
        setShowPopup(true);
    };

    const handleClosePopup = () => {
        setShowPopup(false);
    };

    return (
        <div className="container mx-auto flex flex-col p-4 pt-6 sm:w-4/5 md:w-3/4 lg:w-2/3 xl:w-1/2 2xl:w-1/2 items-center justify-start">
            <h1 className="text-4xl font-bold mb-6 text-center">What would you like to read?</h1>
            <div className="p-6 bg-white rounded shadow-2xl w-full flex flex-col h-[80vh]">
                <div ref={chatBoxRef} className="messages space-y-4 mb-4 overflow-y-auto pr-2 flex-1">
                    {messages.map((msg, index) => (
                        <div
                            key={index}
                            className={`p-3 rounded-lg ${msg.role === 'user' ? 'bg-blue-500 text-white self-end w-3/4 ml-auto' : 'bg-gray-200 self-start w-3/4 mr-auto'}`}
                        >
                            <div>{msg.content}</div>
                            {msg.image && (
                                <div>
                                    <img src={msg.image} alt="chat image" className="w-1/4 h-auto rounded-lg mt-2 mx-auto" />
                                    <div className="flex flex-row">
                                        <button
                                            onClick={() => handleAddToTBR({ work_id: msg.work_id, title: msg.title, author: msg.author })}
                                            className="bg-green-500 text-white px-4 py-2 rounded-lg mt-2 mx-auto block"
                                        >
                                            Add to TBR
                                        </button>
                                        <button
                                            onClick={() => handleNext()}
                                            className="bg-white text-black px-4 py-2 rounded-lg mt-2 mx-auto block"
                                        >
                                            Next Recommendation
                                        </button>
                                        <button
                                            onClick={() => handleViewDetails({ title: msg.title, image_url: msg.image, description: msg.description, author: msg.author })}
                                            className="bg-red-500 text-white px-4 py-2 rounded-lg mt-2 mx-auto block"
                                        >
                                            View Details
                                        </button>
                                    </div>

                                </div>
                            )}
                        </div>
                    ))}
                </div>
                <div className="flex space-x-2 mt-auto">
                    <input
                        type="text"
                        className="flex-1 p-2 border border-gray-300 rounded-lg text-black focus:outline-none"
                        value={input}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        placeholder="Type a message..."
                    />
                    <button className="bg-blue-500 text-white px-4 py-2 rounded-lg" onClick={handleSend}>
                        Send
                    </button>
                </div>
            </div>
            {showPopup && (
                <RateModal exitFunction={handleClosePopup} book={popupContent} />
            )}
        </div>
    );
};

export default Chatbot;

