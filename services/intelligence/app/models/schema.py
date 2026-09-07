import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, Integer, Text, DateTime, ForeignKey, Enum, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base


class Project(Base):
    __tablename__ = "projects"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    start_date = Column(DateTime(timezone=True), nullable=True)
    target_end_date = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    tasks = relationship("Task", back_populates="project", cascade="all, delete-orphan")


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    role = Column(String(100), nullable=False)
    github_username = Column(String(100), unique=True, nullable=False)
    slack_id = Column(String(100), unique=True, nullable=False)
    daily_capacity = Column(Float, default=8.0, nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    tasks = relationship("Task", back_populates="assignee")
    work_events = relationship("WorkEvent", back_populates="user", cascade="all, delete-orphan")
    workload_scores = relationship("WorkloadScore", back_populates="user", cascade="all, delete-orphan")


class Skill(Base):
    __tablename__ = "skills"

    skill_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    skill_name = Column(String(100), unique=True, nullable=False)


class UserSkill(Base):
    __tablename__ = "user_skills"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    skill_id = Column(UUID(as_uuid=True), ForeignKey("skills.skill_id", ondelete="CASCADE"), primary_key=True)
    proficiency_level = Column(Integer, nullable=False)
    source = Column(String(50), nullable=False, default="inferred")
    last_computed_at = Column(DateTime(timezone=True), default=datetime.utcnow)


class Task(Base):
    __tablename__ = "tasks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    external_id = Column(String(100), nullable=False)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    assigned_to = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    estimated_hours = Column(Float, default=4.0, nullable=False)
    hours_remaining = Column(Float, default=4.0, nullable=False)
    status = Column(String(50), default="TODO", nullable=False)
    due_date = Column(DateTime(timezone=True), nullable=True)
    required_skill_id = Column(UUID(as_uuid=True), ForeignKey("skills.skill_id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    project = relationship("Project", back_populates="tasks")
    assignee = relationship("User", back_populates="tasks")


class TaskDependency(Base):
    __tablename__ = "task_dependencies"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    blocking_task_id = Column(UUID(as_uuid=True), ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False)
    dependent_task_id = Column(UUID(as_uuid=True), ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False)
    confidence = Column(String(50), default="explicit", nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)


class WorkEvent(Base):
    __tablename__ = "work_events"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    event_type = Column(String(50), nullable=False)
    event_weight_hours = Column(Float, nullable=False)
    diff_size_bucket = Column(String(10), nullable=True)
    context_identifier = Column(String(255), nullable=True)
    external_reference = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    user = relationship("User", back_populates="work_events")


class WorkloadScore(Base):
    __tablename__ = "workload_scores"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    w_total = Column(Float, nullable=False)
    formula_version = Column(String(50), nullable=False)
    computed_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    user = relationship("User", back_populates="workload_scores")
