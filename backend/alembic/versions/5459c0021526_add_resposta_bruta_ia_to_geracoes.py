"""add resposta_bruta_ia to geracoes

Revision ID: 5459c0021526
Revises: 2abdd4809e4c
Create Date: 2026-11-27 18:16:49.244795

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql

# revision identifiers, used by Alembic.
revision: str = '5459c0021526'
down_revision: Union[str, Sequence[str], None] = '2abdd4809e4c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column(
        'geracoes',
        sa.Column(
            'resposta_bruta_ia',
            sa.Text().with_variant(mysql.LONGTEXT(), 'mysql'),
            nullable=True,
        ),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('geracoes', 'resposta_bruta_ia')