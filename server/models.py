from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text, Boolean
from sqlalchemy.orm import relationship
from database import Base
import datetime

class Client(Base):
    __tablename__ = "clients"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, default="Unknown")
    phone_number = Column(String, unique=True, index=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    conversations = relationship("Conversation", back_populates="client")


class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("clients.id"))
    started_at = Column(DateTime, default=datetime.datetime.utcnow)
    is_active = Column(Boolean, default=True)
    is_archived = Column(Boolean, default=False)
    is_pinned = Column(Boolean, default=False)

    client = relationship("Client", back_populates="conversations")
    messages = relationship("Message", back_populates="conversation")


class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(Integer, ForeignKey("conversations.id"))
    sender = Column(String) # "user" (client), "agent" (AI), "system"
    content = Column(Text)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    status = Column(String, default="sent") # pending, sent, delivered, failed
    is_ai_generated = Column(Boolean, default=False)
    confidence = Column(Integer, default=0) # 0-100
    metadata_json = Column(Text, default="{}") # Stores intent, tone, reasoning in JSON format
    
    conversation = relationship("Conversation", back_populates="messages")
