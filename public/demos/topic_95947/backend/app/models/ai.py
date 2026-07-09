from sqlalchemy import Column, String, UUID, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
import uuid
from app.models.base import BaseModel

class AIConversation(BaseModel):
    __tablename__ = "ai_conversations"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    merchant_id = Column(UUID(as_uuid=True), ForeignKey("merchants.id"), nullable=False)
    session_id = Column(String(100), nullable=False)
    topic = Column(String(200))
    agent_type = Column(String(50), nullable=False, default="operations")
    
    merchant = relationship("Merchant", back_populates="ai_conversations")
    messages = relationship("AIMessage", back_populates="conversation")

class AIMessage(BaseModel):
    __tablename__ = "ai_messages"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    conversation_id = Column(UUID(as_uuid=True), ForeignKey("ai_conversations.id"), nullable=False)
    role = Column(String(20), nullable=False)
    content = Column(Text, nullable=False)
    message_metadata = Column(JSON)
    
    conversation = relationship("AIConversation", back_populates="messages")

class AIAnalysisResult(BaseModel):
    __tablename__ = "ai_analysis_results"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    merchant_id = Column(UUID(as_uuid=True), ForeignKey("merchants.id"), nullable=False)
    analysis_type = Column(String(50), nullable=False)
    time_range = Column(String(20))
    result_data = Column(JSON)
    summary = Column(Text)
    
    merchant = relationship("Merchant")

class AIActionCard(BaseModel):
    __tablename__ = "ai_action_cards"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    merchant_id = Column(UUID(as_uuid=True), ForeignKey("merchants.id"), nullable=False)
    title = Column(String(200), nullable=False)
    problem = Column(Text)
    evidence = Column(JSON)
    suggested_action = Column(JSON)
    priority = Column(String(20), nullable=False, default="medium")
    status = Column(String(30), nullable=False, default="draft")
    data_range = Column(String(100))
    expected_impact = Column(Text)
    source = Column(String(80), default="structured_diagnosis")
    assignee = Column(String(100))
    due_date = Column(String(30))
    material = Column(JSON)
    review_result = Column(JSON)
    completed_at = Column(String(30))

    merchant = relationship("Merchant")

class AIToolCallLog(BaseModel):
    __tablename__ = "ai_tool_call_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    merchant_id = Column(UUID(as_uuid=True), ForeignKey("merchants.id"), nullable=False)
    tool_name = Column(String(100), nullable=False)
    parameters = Column(JSON)
    result_summary = Column(Text)
    status = Column(String(30), nullable=False, default="success")
    error_message = Column(Text)

    merchant = relationship("Merchant")

class AIMemory(BaseModel):
    __tablename__ = "ai_memories"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    merchant_id = Column(UUID(as_uuid=True), ForeignKey("merchants.id"), nullable=False)
    memory_type = Column(String(50), nullable=False)
    key = Column(String(120), nullable=False)
    value = Column(JSON)
    source = Column(String(80), default="system")

    merchant = relationship("Merchant")

class AIReviewRecord(BaseModel):
    __tablename__ = "ai_review_records"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    merchant_id = Column(UUID(as_uuid=True), ForeignKey("merchants.id"), nullable=False)
    action_card_id = Column(UUID(as_uuid=True), ForeignKey("ai_action_cards.id"), nullable=False)
    before_data = Column(JSON)
    after_data = Column(JSON)
    result_metrics = Column(JSON)
    analysis = Column(Text)
    next_steps = Column(JSON)

    merchant = relationship("Merchant")
    action_card = relationship("AIActionCard")

class AIQualityCase(BaseModel):
    __tablename__ = "ai_quality_cases"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    merchant_id = Column(UUID(as_uuid=True), ForeignKey("merchants.id"), nullable=True)
    name = Column(String(160), nullable=False)
    prompt = Column(Text, nullable=False)
    expected_checks = Column(JSON)
    last_result = Column(JSON)
    status = Column(String(30), default="draft")


class AIAgentConfig(BaseModel):
    __tablename__ = "ai_agent_configs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    merchant_id = Column(UUID(as_uuid=True), ForeignKey("merchants.id"), nullable=True)
    agent_type = Column(String(50), nullable=False)
    name = Column(String(120), nullable=False)
    description = Column(Text)
    icon = Column(String(80), default="fas fa-robot")
    color = Column(String(30), default="#3b82f6")
    system_prompt = Column(Text, nullable=False)
    enabled = Column(String(10), default="true")
    is_builtin = Column(String(10), default="false")

    merchant = relationship("Merchant")
