"""data_pipeline_tables

Revision ID: 002_data_pipeline_tables
Revises: 001_initial_data_api_tables
Create Date: 2026-08-15 20:40:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '002_data_pipeline_tables'
down_revision: Union[str, None] = '001_initial_data_api_tables'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Create data_documents table
    op.create_table(
        'data_documents',
        sa.Column('id', sa.String(length=64), nullable=False),
        sa.Column('resource_id', sa.String(length=64), nullable=False),
        sa.Column('raw_text', sa.Text(), nullable=True),
        sa.Column('clean_text', sa.Text(), nullable=True),
        sa.Column('mime_type', sa.String(length=128), server_default='text/plain', nullable=False),
        sa.Column('file_size_bytes', sa.BigInteger(), nullable=True),
        sa.Column('page_count', sa.Integer(), nullable=True),
        sa.Column('language', sa.String(length=16), server_default='en', nullable=False),
        sa.Column('meta_info', sa.JSON(), nullable=True),
        sa.Column('extraction_status', sa.String(length=64), server_default='PENDING', nullable=False),
        sa.Column('extraction_method', sa.String(length=64), server_default='DIRECT_TEXT', nullable=False),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['resource_id'], ['data_resources.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('idx_data_documents_resource_id', 'data_documents', ['resource_id'])
    op.create_index('idx_data_documents_status', 'data_documents', ['extraction_status'])
    op.create_index('idx_data_documents_resource_status', 'data_documents', ['resource_id', 'extraction_status'])

    # 2. Create data_chunks table
    op.create_table(
        'data_chunks',
        sa.Column('id', sa.String(length=64), nullable=False),
        sa.Column('document_id', sa.String(length=64), nullable=False),
        sa.Column('chunk_index', sa.Integer(), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('token_count', sa.Integer(), server_default='0', nullable=False),
        sa.Column('character_count', sa.Integer(), server_default='0', nullable=False),
        sa.Column('heading', sa.String(length=512), nullable=True),
        sa.Column('section', sa.String(length=255), nullable=True),
        sa.Column('chunk_hash', sa.String(length=64), nullable=True),
        sa.Column('metadata_json', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['document_id'], ['data_documents.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('idx_data_chunks_document_id', 'data_chunks', ['document_id'])
    op.create_index('idx_data_chunks_hash', 'data_chunks', ['chunk_hash'])
    op.create_index('idx_data_chunks_doc_index', 'data_chunks', ['document_id', 'chunk_index'], unique=True)

    # 3. Create data_ingestion_jobs table
    op.create_table(
        'data_ingestion_jobs',
        sa.Column('id', sa.String(length=64), nullable=False),
        sa.Column('source_id', sa.String(length=64), nullable=True),
        sa.Column('resource_id', sa.String(length=64), nullable=True),
        sa.Column('job_type', sa.String(length=64), server_default='EXTRACTION', nullable=False),
        sa.Column('status', sa.String(length=64), server_default='PENDING', nullable=False),
        sa.Column('progress_percentage', sa.Integer(), server_default='0', nullable=False),
        sa.Column('items_processed', sa.Integer(), server_default='0', nullable=False),
        sa.Column('total_items', sa.Integer(), server_default='0', nullable=False),
        sa.Column('error_log', sa.Text(), nullable=True),
        sa.Column('meta_info', sa.JSON(), nullable=True),
        sa.Column('started_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['source_id'], ['data_sources.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['resource_id'], ['data_resources.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('idx_data_jobs_status', 'data_ingestion_jobs', ['status'])
    op.create_index('idx_data_jobs_type', 'data_ingestion_jobs', ['job_type'])
    op.create_index('idx_data_jobs_type_status', 'data_ingestion_jobs', ['job_type', 'status'])

    # 4. Create data_questions table
    op.create_table(
        'data_questions',
        sa.Column('id', sa.String(length=64), nullable=False),
        sa.Column('resource_id', sa.String(length=64), nullable=True),
        sa.Column('exam', sa.String(length=64), server_default='UPSC_CSE', nullable=False),
        sa.Column('year', sa.Integer(), nullable=True),
        sa.Column('paper', sa.String(length=64), server_default='GS1', nullable=False),
        sa.Column('subject', sa.String(length=64), server_default='POLITY', nullable=False),
        sa.Column('topic', sa.String(length=255), nullable=True),
        sa.Column('question_type', sa.String(length=32), server_default='MCQ', nullable=False),
        sa.Column('question_text', sa.Text(), nullable=False),
        sa.Column('options', sa.JSON(), nullable=True),
        sa.Column('correct_answer', sa.String(length=255), nullable=False),
        sa.Column('explanation', sa.Text(), nullable=False),
        sa.Column('difficulty', sa.String(length=32), server_default='MEDIUM', nullable=False),
        sa.Column('marks', sa.Float(), server_default='2.0', nullable=False),
        sa.Column('negative_marks', sa.Float(), server_default='0.66', nullable=False),
        sa.Column('tags', sa.JSON(), nullable=True),
        sa.Column('is_pyq', sa.Boolean(), server_default=sa.text('true'), nullable=False),
        sa.Column('is_verified', sa.Boolean(), server_default=sa.text('true'), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['resource_id'], ['data_resources.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('idx_data_questions_exam', 'data_questions', ['exam'])
    op.create_index('idx_data_questions_year', 'data_questions', ['year'])
    op.create_index('idx_data_questions_subject', 'data_questions', ['subject'])
    op.create_index('idx_data_questions_type', 'data_questions', ['question_type'])
    op.create_index('idx_data_questions_is_pyq', 'data_questions', ['is_pyq'])
    op.create_index('idx_data_questions_exam_year_paper', 'data_questions', ['exam', 'year', 'paper'])
    op.create_index('idx_data_questions_subject_type', 'data_questions', ['subject', 'question_type'])

    # 5. Create data_tags table
    op.create_table(
        'data_tags',
        sa.Column('id', sa.String(length=64), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('slug', sa.String(length=255), nullable=False),
        sa.Column('category', sa.String(length=64), server_default='TOPIC', nullable=False),
        sa.Column('description', sa.Text(), server_default='', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('idx_data_tags_slug', 'data_tags', ['slug'], unique=True)
    op.create_index('idx_data_tags_category', 'data_tags', ['category'])
    op.create_index('idx_data_tags_cat_slug', 'data_tags', ['category', 'slug'])


def downgrade() -> None:
    op.drop_table('data_tags')
    op.drop_table('data_questions')
    op.drop_table('data_ingestion_jobs')
    op.drop_table('data_chunks')
    op.drop_table('data_documents')
