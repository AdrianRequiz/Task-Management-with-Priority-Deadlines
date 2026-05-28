from django.urls import path
from .views import KnowledgeBaseView, ChatbotView

urlpatterns = [
    path('knowledge-base/', KnowledgeBaseView.as_view(), name='knowledge-base'),
    path('chatbot/', ChatbotView.as_view(), name='chatbot'),
]