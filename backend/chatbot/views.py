import requests
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import KnowledgeBase, ChatMessage
from .serializers import KnowledgeBaseSerializer, ChatMessageSerializer

class KnowledgeBaseView(generics.ListCreateAPIView):
    queryset = KnowledgeBase.objects.all()
    serializer_class = KnowledgeBaseSerializer
    permission_classes = [IsAuthenticated]

class ChatbotView(generics.ListCreateAPIView):
    queryset = ChatMessage.objects.all()
    serializer_class = ChatMessageSerializer
    permission_classes = [IsAuthenticated]

    def create(self, request, *args, **kwargs):
        user_message = request.data.get("message")
        if not user_message:
            return Response({"error": "Message is required"}, status=status.HTTP_400_BAD_REQUEST)

        # Save user message
        user_chat = ChatMessage.objects.create(role='user', message=user_message)

        # Build knowledge context
        knowledge_items = KnowledgeBase.objects.all()
        context = "\n".join([item.text_content for item in knowledge_items if item.text_content])

        prompt = f"""You are a helpful assistant.

Knowledge:
{context}

User: {user_message}
Assistant:"""

        try:
            response = requests.post(
                "http://localhost:11434/api/generate",
                json={
                    "model": "qwen2.5:0.5b",
                    "prompt": prompt,
                    "stream": False
                },
                timeout=30
            )
            response.raise_for_status()
            ai_response = response.json().get("response", "No response from model")
        except Exception as e:
            ai_response = f"Error: {str(e)}"

        # Save AI response
        ai_chat = ChatMessage.objects.create(role='assistant', message=ai_response)

        return Response({
            "user": ChatMessageSerializer(user_chat).data,
            "assistant": ChatMessageSerializer(ai_chat).data
        })