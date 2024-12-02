import { useState, useEffect, useRef } from 'react';
import axiosInstance from '../axiosConfig';
import { RateModal } from '../components/RateModal';
import { ApiResponse, ChatResponseData } from '../types/api';


// this goes in api.ts
// export interface ChatResponseData {
//     content: string;
//     image?: string;
//     work_id?: string;
//     title?: string;
//     author?: string;
//     description?: string;
//     matches: Array<{
//         id: string;
//         metadata: {
//             title: string;
//             author_name: string;
//             image_url: string;
//             description: string;
//         };
//     }>;
// }

interface Message {
  role: 'user' | 'assistant';
  content: string;
  image?: string | null;
  work_id?: string;
  title?: string;
  author?: string;
  description?: string;
}

interface BookDetails {
  work_id: string;
  title: string;
  author: string;
  image_url: string;
  description?: string;
}

function Chat(): JSX.Element {
  const [messages, setMessages] = useState<Message[]>([]);
  const matchesRef = useRef<ChatResponseData['matches']>([]);
  const currentMessageRef = useRef<Message>({} as Message);
  const [input, setInput] = useState('');
  const chatBoxRef = useRef<HTMLDivElement>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [popupContent, setPopupContent] = useState<BookDetails>({} as BookDetails);

  useEffect(() => {
    console.log('Chatbot mounted');
    handleGet();
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
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

  const handleGet = async () => {
    try {
      const response = await axiosInstance.get<ApiResponse<ChatResponseData>>('api/chat', {
        params: {
          current_message: JSON.stringify(currentMessageRef.current),
          matches: JSON.stringify(matchesRef.current)
        }
      });

      const { content, image, work_id, title, author, description, matches } = response.data.data!;
      matchesRef.current = matches;
      setMessages((prevMessages) => [
        ...prevMessages,
        { role: 'assistant', content, image, work_id, title, author, description }
      ]);
    } catch (error) {
      console.error('Error fetching chat response:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  const handleAddToTBR = async (book: BookDetails) => {
    try {
      await axiosInstance.post('api/to-be-read/', book);
      console.log('Added to TBR:', book.title);
    } catch (error) {
      console.error('Error adding to TBR:', error);
    }
  };

  const handleViewDetails = (book: BookDetails) => {
    setPopupContent(book);
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
              className={`p-3 rounded-lg ${msg.role === 'user' ? 'bg-teal-800 text-white self-end w-3/4 ml-auto' : 'bg-gray-200 self-start w-3/4 mr-auto'}`}
            >
              <div>{msg.content}</div>
              {msg.image && (
                <div>
                  <img src={msg.image} alt="chat image" className="w-1/4 h-auto rounded-lg my-3 mx-auto" />
                  <div className="flex flex-row">
                    <button
                      onClick={() => handleAddToTBR({ 
                        work_id: msg.work_id!, 
                        title: msg.title!, 
                        author: msg.author!, 
                        image_url: msg.image 
                      })}
                      className="bg-green-500 text-white px-4 py-2 rounded-lg mt-2 mx-auto block w-[30%]"
                    >
                      Add to TBR
                    </button>
                    <button
                      onClick={() => handleViewDetails({ 
                        work_id: msg.work_id!, 
                        title: msg.title!, 
                        image_url: msg.image, 
                        description: msg.description, 
                        author: msg.author! 
                      })}
                      className="bg-teal-800 text-white px-4 py-2 rounded-lg mt-2 mx-auto block w-[30%]"
                    >
                      View Details
                    </button>
                    <button
                      onClick={handleNext}
                      className="bg-gray-500 text-white px-4 py-2 rounded-lg mt-2 mx-auto block w-[30%]"
                    >
                      Next Rec
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
          <button 
            className="bg-teal-800 text-white px-4 py-2 rounded-lg" 
            onClick={handleSend}
          >
            Send
          </button>
        </div>
      </div>
      {showPopup && (
        <RateModal exitFunction={handleClosePopup} book={popupContent} />
      )}
    </div>
  );
}

export default Chat; 