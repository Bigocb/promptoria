"""Initial schema with all tables

Revision ID: 001_initial
Revises:
Create Date: 2026-03-30 14:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '001_initial'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create users table
    op.create_table(
        'users',
        sa.Column('id', sa.String(36), nullable=False),
        sa.Column('email', sa.String(255), nullable=False),
        sa.Column('password', sa.String(255), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('email'),
        sa.Index('idx_users_email', 'email')
    )

    # Create user_settings table
    op.create_table(
        'user_settings',
        sa.Column('id', sa.String(36), nullable=False),
        sa.Column('user_id', sa.String(36), nullable=False),
        sa.Column('theme', sa.String(50), nullable=False, server_default='gruvbox-dark'),
        sa.Column('suggestions_enabled', sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column('default_model', sa.String(100), nullable=False, server_default='claude-3-haiku'),
        sa.Column('default_temperature', sa.Float(), nullable=False, server_default='0.7'),
        sa.Column('default_max_tokens', sa.Integer(), nullable=False, server_default='500'),
        sa.Column('anthropic_api_key', sa.String(1000), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id')
    )

    # Create workspaces table
    op.create_table(
        'workspaces',
        sa.Column('id', sa.String(36), nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('slug', sa.String(255), nullable=False),
        sa.Column('user_id', sa.String(36), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('slug'),
        sa.UniqueConstraint('user_id'),
        sa.Index('idx_workspaces_slug', 'slug'),
        sa.Index('idx_workspaces_user_id', 'user_id')
    )

    # Create folders table
    op.create_table(
        'folders',
        sa.Column('id', sa.String(36), nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('workspace_id', sa.String(36), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['workspace_id'], ['workspaces.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.Index('idx_folder_workspace_id', 'workspace_id')
    )

    # Create agent_interaction_types table
    op.create_table(
        'agent_interaction_types',
        sa.Column('id', sa.String(36), nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('emoji', sa.String(10), nullable=True),
        sa.Column('workspace_id', sa.String(36), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['workspace_id'], ['workspaces.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.Index('idx_interaction_type_workspace', 'workspace_id'),
        sa.Index('idx_interaction_type_name_unique', 'workspace_id', 'name', unique=True)
    )

    # Create prompt_categories table
    op.create_table(
        'prompt_categories',
        sa.Column('id', sa.String(36), nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('workspace_id', sa.String(36), nullable=False),
        sa.Column('agent_interaction_type_id', sa.String(36), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['agent_interaction_type_id'], ['agent_interaction_types.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['workspace_id'], ['workspaces.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.Index('idx_category_workspace', 'workspace_id'),
        sa.Index('idx_category_interaction_type', 'agent_interaction_type_id'),
        sa.Index('idx_category_name_unique', 'workspace_id', 'name', unique=True)
    )

    # Create snippets table
    op.create_table(
        'snippets',
        sa.Column('id', sa.String(36), nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('workspace_id', sa.String(36), nullable=False),
        sa.Column('folder_id', sa.String(36), nullable=True),
        sa.Column('version', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['folder_id'], ['folders.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['workspace_id'], ['workspaces.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.Index('idx_snippet_workspace_id', 'workspace_id'),
        sa.Index('idx_snippet_folder_id', 'folder_id'),
        sa.Index('idx_snippet_name_workspace', 'workspace_id', 'name', unique=True)
    )

    # Create prompts table
    op.create_table(
        'prompts',
        sa.Column('id', sa.String(36), nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('workspace_id', sa.String(36), nullable=False),
        sa.Column('folder_id', sa.String(36), nullable=True),
        sa.Column('category_id', sa.String(36), nullable=True),
        sa.Column('tags', sa.JSON(), nullable=True),
        sa.Column('model', sa.String(100), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['category_id'], ['prompt_categories.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['folder_id'], ['folders.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['workspace_id'], ['workspaces.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.Index('idx_prompt_workspace_id', 'workspace_id'),
        sa.Index('idx_prompt_folder_id', 'folder_id'),
        sa.Index('idx_prompt_category_id', 'category_id')
    )

    # Create prompt_versions table
    op.create_table(
        'prompt_versions',
        sa.Column('id', sa.String(36), nullable=False),
        sa.Column('prompt_id', sa.String(36), nullable=False),
        sa.Column('version_number', sa.Integer(), nullable=False),
        sa.Column('template_body', sa.Text(), nullable=False),
        sa.Column('model_config', sa.JSON(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['prompt_id'], ['prompts.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.Index('idx_prompt_version_prompt_id', 'prompt_id'),
        sa.Index('idx_prompt_version_version', 'prompt_id', 'version_number', unique=True)
    )

    # Create prompt_compositions table (junction table)
    op.create_table(
        'prompt_compositions',
        sa.Column('id', sa.String(36), nullable=False),
        sa.Column('prompt_version_id', sa.String(36), nullable=False),
        sa.Column('snippet_id', sa.String(36), nullable=False),
        sa.Column('rank', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['prompt_version_id'], ['prompt_versions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['snippet_id'], ['snippets.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.Index('idx_composition_version_id', 'prompt_version_id'),
        sa.Index('idx_composition_snippet_id', 'snippet_id')
    )

    # Create test_runs table
    op.create_table(
        'test_runs',
        sa.Column('id', sa.String(36), nullable=False),
        sa.Column('prompt_version_id', sa.String(36), nullable=False),
        sa.Column('prompt_id', sa.String(36), nullable=False),
        sa.Column('workspace_id', sa.String(36), nullable=False),
        sa.Column('variables', sa.JSON(), nullable=True),
        sa.Column('compiled_prompt', sa.Text(), nullable=False),
        sa.Column('output', sa.Text(), nullable=True),
        sa.Column('model', sa.String(100), nullable=True),
        sa.Column('input_tokens', sa.Integer(), nullable=True),
        sa.Column('output_tokens', sa.Integer(), nullable=True),
        sa.Column('total_tokens', sa.Integer(), nullable=True),
        sa.Column('cost_usd', sa.Float(), nullable=True),
        sa.Column('latency_ms', sa.Integer(), nullable=True),
        sa.Column('status', sa.String(20), nullable=False, server_default='pending'),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['prompt_id'], ['prompts.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['prompt_version_id'], ['prompt_versions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['workspace_id'], ['workspaces.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.Index('idx_testrun_version', 'prompt_version_id'),
        sa.Index('idx_testrun_prompt', 'prompt_id'),
        sa.Index('idx_testrun_workspace', 'workspace_id')
    )


def downgrade() -> None:
    # Drop all tables in reverse order of creation
    op.drop_table('test_runs')
    op.drop_table('prompt_compositions')
    op.drop_table('prompt_versions')
    op.drop_table('prompts')
    op.drop_table('snippets')
    op.drop_table('prompt_categories')
    op.drop_table('agent_interaction_types')
    op.drop_table('folders')
    op.drop_table('workspaces')
    op.drop_table('user_settings')
    op.drop_table('users')
