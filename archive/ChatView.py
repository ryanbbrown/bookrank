
class ChatView(APIView):
    """
    This view contains the logic for generating chat responses.
    """
    def get(self, request):
        """
        Generates a chat response based on the user's input.
        """
        current_message = json.loads(request.query_params.get('current_message'))
        matches = json.loads(request.query_params.get('matches'))
        
        # return a default message if no user input
        if 'content' not in current_message:
            response = 'Hello! How can I assist you today?'
            return Response({
                'success': True,
                'data': {
                    'role': 'assistant',
                    'content': response,
                    'matches': matches
                },
                'message': 'Default greeting sent'
            })
        else:
            last_message_content = current_message['content']
            print('Last message content', last_message_content)

        # get matches from vector db if not passed
        if len(matches) == 0:
            vector = embedding_model.encode(last_message_content).tolist()
            matches = index.query(
                vector=vector,
                top_k=10,
                metric='cosine',
                include_metadata=True,
                include_values=False,
            ).to_dict()['matches']

            # get rid of description so that it doesn't 
            for match in matches:
                match['metadata']['description'] = ''

        # get the first match and generate a response
        match = matches[0]
        match_description = index.fetch(ids=[match['id']])['vectors'][match['id']]['metadata']['description']
        print(match)
        filled_prompt = SUMMARY_PROMPT.format(
            user_query=last_message_content,
            # book_description=match['metadata']['description'],
            book_description=match_description,
            book_title=match['metadata']['title'],
        )
        new_messages = [{'role': 'user', 'content': filled_prompt}]
        response = groq_client.chat.completions.create(
            messages=new_messages,
            model="llama3-8b-8192"
        )
        # TODO: will have to change how front end handles this
        return Response({
            'success': True,
            'data': {
                'content': response.choices[0].message.content,
                'image': match['metadata']['image_url'],
                'work_id': match['id'],
                'title': match['metadata']['title'],
                'author': match['metadata']['author_name'],
                'description': match_description,
                'matches': matches[1:]  # get rid of the match you just showed
            },
            'message': 'Chat response generated successfully'
        })