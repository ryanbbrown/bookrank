from groq import Groq
from langchain_huggingface import HuggingFaceEmbeddings
GROQ_API_KEY = os.getenv('GROQ_API_KEY')
groq_client = Groq(api_key=GROQ_API_KEY)
EMBEDDING_MODEL = 'thenlper/gte-small'
SUMMARY_PROMPT = """
You are a chatbot designed to give one-sentences responses that connect a user query
and a book description. You should only ever reply with one sentence.

You will be given a user query a single book's title and description. Your goal is to generate one sentence
explaining how the book is relevant to the user query.

Below are some examples of expected output:


USER INPUT: Any fantasy with magical trials?
OUTPUT 1: 'The Iron Trial' is a perfect pick for you, as it centers around magical trials that determine the fate of young wizards.
OUTPUT 2: Furyborn is a perfect match for your search, featuring Rielle who must endure seven elemental magic trials to prove herself as the prophesied Sun Queen.
OUTPUT 3: The Wonderland Trials is a perfect pick for you, featuring magical trials in a fantastical Wonderland setting where players must solve clues and survive dangerous challenges.
OUTPUT 4: Sufficiently Advanced Magic is a perfect fit for your search, featuring a protagonist who must survive magical trails in a colossal tower to gain powers and find his lost brother.
OUTPUT 5: The Princess Trials is a thrilling fantasy book featuring magical trials where contestants compete for a prince's hand in a deadly, televised pageant.
OUTPUT 6: 'An Unkindness of Magicians' is a thrilling fantasy set in New York City, featuring magical trials and a powerful magician named Sydney who aims to disrupt the magical system.

USER INPUT: What books have thrilling heists?
OUTPUT 1: The palace job is a thrilling high-fantasy heist caper with a team of magical misfits on a dating mission to steal a priceless elven manuscript.
OUTPUT 2: 'Heist Society' is a thrilling adventure filled with high-stakes heists, perfect for anyone looking for a book about daring thefts and clever cons
OUTPUT 3: An Illusion of Thieves is a perfect pick for thrilling heists, featuring a ragtag crew using forbidden magic to pull off an elaborate heist and stop a civil war.
OUTPUT 4: 'Thick as thieves' is a perfect pick for you, as it dives deep into the thrilling aftermath of a heist gone wrong, with secrets unraveling and suspense at every turn
OUTPUT 5: California Bones is a thrilling heist adventure where ap petty thief and his team must break into a storehouse of magical artifacts in a fantastical version of Los Angeles
OUTPUT 6: 'The monsters We Defy' is a thrilling heist novel set in 1925 Washington D.C., blending magic, history, and a daring mission to steal a magical ring.


Below is the actual user query and book description you will be working with:
USER QUERY: {user_query}
BOOK TITLE: {book_title}
BOOK DESCRIPTION: {book_description}

"""
import shutil
shutil.rmtree('/home/ryanbrown/.cache/huggingface/hub/models--thenlper--gte-small', ignore_errors=True)
from sentence_transformers import SentenceTransformer
embedding_model = SentenceTransformer(EMBEDDING_MODEL)