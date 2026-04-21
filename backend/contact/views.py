from rest_framework import generics, status, permissions
from rest_framework.response import Response
from .serializers import ContactMessageSerializer


class ContactView(generics.CreateAPIView):
    serializer_class = ContactMessageSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(
            {'detail': 'Your message has been received. We will get back to you soon.'},
            status=status.HTTP_201_CREATED
        )
