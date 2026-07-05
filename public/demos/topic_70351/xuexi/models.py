import os
from datetime import datetime
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()


class Textbook(db.Model):
    __tablename__ = 'textbooks'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    grade = db.Column(db.String(20), nullable=False)
    semester = db.Column(db.String(20), nullable=False)
    sort_order = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    units = db.relationship('Unit', backref='textbook', lazy=True, order_by='Unit.sort_order')

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'grade': self.grade,
            'semester': self.semester,
            'sort_order': self.sort_order,
            'unit_count': len(self.units)
        }


class Unit(db.Model):
    __tablename__ = 'units'

    id = db.Column(db.Integer, primary_key=True)
    textbook_id = db.Column(db.Integer, db.ForeignKey('textbooks.id'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    unit_number = db.Column(db.Integer, default=1)
    description = db.Column(db.Text, default='')
    sort_order = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    questions = db.relationship('Question', backref='unit', lazy=True, order_by='Question.sort_order')

    def to_dict(self):
        return {
            'id': self.id,
            'textbook_id': self.textbook_id,
            'name': self.name,
            'unit_number': self.unit_number,
            'description': self.description,
            'sort_order': self.sort_order,
            'question_count': len(self.questions)
        }


class Question(db.Model):
    __tablename__ = 'questions'

    id = db.Column(db.Integer, primary_key=True)
    unit_id = db.Column(db.Integer, db.ForeignKey('units.id'), nullable=False)
    question_type = db.Column(db.String(30), nullable=False)
    difficulty = db.Column(db.String(10), default='medium')
    content = db.Column(db.Text, nullable=False)
    options = db.Column(db.Text, default='')
    answer = db.Column(db.Text, nullable=False)
    analysis = db.Column(db.Text, default='')
    knowledge_point = db.Column(db.String(200), default='')
    sort_order = db.Column(db.Integer, default=0)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self, include_answer=True):
        data = {
            'id': self.id,
            'unit_id': self.unit_id,
            'question_type': self.question_type,
            'difficulty': self.difficulty,
            'content': self.content,
            'knowledge_point': self.knowledge_point,
        }
        if self.options:
            try:
                import json
                data['options'] = json.loads(self.options)
            except (json.JSONDecodeError, TypeError):
                data['options'] = []
        else:
            data['options'] = []
        if include_answer:
            data['answer'] = self.answer
            data['analysis'] = self.analysis
        return data


class AnswerRecord(db.Model):
    __tablename__ = 'answer_records'

    id = db.Column(db.Integer, primary_key=True)
    question_id = db.Column(db.Integer, db.ForeignKey('questions.id'), nullable=False)
    user_answer = db.Column(db.Text, default='')
    is_correct = db.Column(db.Boolean, default=False)
    time_spent = db.Column(db.Integer, default=0)
    session_id = db.Column(db.String(100), default='')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    question = db.relationship('Question', backref='answer_records', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'question_id': self.question_id,
            'user_answer': self.user_answer,
            'is_correct': self.is_correct,
            'time_spent': self.time_spent,
            'session_id': self.session_id,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'question': self.question.to_dict() if self.question else None
        }


class ExamPaper(db.Model):
    __tablename__ = 'exam_papers'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, default='')
    textbook_id = db.Column(db.Integer, db.ForeignKey('textbooks.id'), nullable=True)
    duration = db.Column(db.Integer, default=60)
    total_score = db.Column(db.Float, default=100.0)
    question_count = db.Column(db.Integer, default=0)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    questions = db.relationship('ExamQuestion', backref='exam_paper', lazy=True, order_by='ExamQuestion.sort_order')

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'textbook_id': self.textbook_id,
            'duration': self.duration,
            'total_score': self.total_score,
            'question_count': len(self.questions),
            'is_active': self.is_active
        }


class ExamQuestion(db.Model):
    __tablename__ = 'exam_questions'

    id = db.Column(db.Integer, primary_key=True)
    exam_paper_id = db.Column(db.Integer, db.ForeignKey('exam_papers.id'), nullable=False)
    question_id = db.Column(db.Integer, db.ForeignKey('questions.id'), nullable=False)
    score = db.Column(db.Float, default=2.0)
    sort_order = db.Column(db.Integer, default=0)

    question = db.relationship('Question', lazy=True)

    def to_dict(self, include_answer=True):
        data = {
            'id': self.id,
            'exam_paper_id': self.exam_paper_id,
            'question_id': self.question_id,
            'score': self.score,
            'sort_order': self.sort_order,
        }
        if self.question:
            data['question'] = self.question.to_dict(include_answer=include_answer)
        return data


def init_db(app):
    db.init_app(app)
    with app.app_context():
        db.create_all()
