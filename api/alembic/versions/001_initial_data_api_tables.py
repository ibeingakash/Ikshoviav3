"""initial_data_api_tables

Revision ID: 001_initial_data_api_tables
Revises: 
Create Date: 2026-08-15 20:25:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '001_initial_data_api_tables'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Create data_sources table if not exists
    op.create_table(
        'data_sources',
        sa.Column('id', sa.String(length=64), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('slug', sa.String(length=255), nullable=False),
        sa.Column('base_url', sa.String(length=1024), nullable=False),
        sa.Column('source_type', sa.String(length=64), server_default='GOVERNMENT', nullable=False),
        sa.Column('is_active', sa.Boolean(), server_default=sa.text('true'), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('idx_data_sources_slug', 'data_sources', ['slug'], unique=True)
    op.create_index('idx_data_sources_is_active', 'data_sources', ['is_active'])
    op.create_index('idx_data_sources_type_active', 'data_sources', ['source_type', 'is_active'])

    # 2. Create data_resources table
    op.create_table(
        'data_resources',
        sa.Column('id', sa.String(length=64), nullable=False),
        sa.Column('source_id', sa.String(length=64), nullable=False),
        sa.Column('title', sa.String(length=512), nullable=False),
        sa.Column('url', sa.String(length=2048), nullable=False),
        sa.Column('resource_type', sa.String(length=64), server_default='ARTICLE', nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('published_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('retrieved_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('content_hash', sa.String(length=64), nullable=True),
        sa.Column('status', sa.String(length=64), server_default='DISCOVERED', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['source_id'], ['data_sources.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('idx_data_resources_url', 'data_resources', ['url'], unique=True)
    op.create_index('idx_data_resources_source_id', 'data_resources', ['source_id'])
    op.create_index('idx_data_resources_resource_type', 'data_resources', ['resource_type'])
    op.create_index('idx_data_resources_status', 'data_resources', ['status'])
    op.create_index('idx_data_resources_content_hash', 'data_resources', ['content_hash'])
    op.create_index('idx_data_resources_published', 'data_resources', ['published_at'])
    op.create_index('idx_data_resources_source_type_status', 'data_resources', ['source_id', 'resource_type', 'status'])


def downgrade() -> None:
    op.drop_table('data_resources')
    op.drop_table('data_sources')
